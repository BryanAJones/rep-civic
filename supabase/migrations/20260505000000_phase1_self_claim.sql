-- B6-1 Phase 1: Self-onboarding candidate claim — schema
--
-- Two new tables:
--   pending_claims     short-TTL row tying an in-flight claim attempt to a
--                      candidate_id, filing_id, and verification_method.
--                      The UNIQUE partial index on (candidate_id) WHERE
--                      status='pending' prevents two users from racing into
--                      the same magic-link window.
--   candidate_registry verification-only registry, populated nightly by the
--                      Ballotpedia scraper (B6-3) and on-demand by the FEC
--                      API path. Separate from `candidates` because it's
--                      not user-facing — it exists only to answer "does
--                      filing_id X belong to a real candidate, and what
--                      contact channel can we use to verify them?"
--
-- Audit hooks: pending_claims status transitions write to audit_log via
-- a SECURITY DEFINER trigger, mirroring the candidate_claims/status pattern
-- from S-19.

-- ============================================================
-- 1. pending_claims
-- ============================================================
CREATE TABLE pending_claims (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id        UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filing_id           TEXT NOT NULL,
  level               TEXT NOT NULL CHECK (level IN ('federal', 'state', 'local')),
  verification_method TEXT NOT NULL CHECK (verification_method IN ('fec_email', 'registry_email', 'social_proof')),
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'verified', 'expired', 'revoked', 'failed')),
  contact_email       TEXT,
  social_proof_code   TEXT,
  expires_at          TIMESTAMPTZ NOT NULL DEFAULT now() + interval '30 minutes',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at         TIMESTAMPTZ
);

-- One in-flight claim per candidate. Concurrent attempts hit unique_violation
-- and are told the slot is taken until the existing one expires or completes.
CREATE UNIQUE INDEX idx_pending_claims_candidate_pending
  ON pending_claims(candidate_id) WHERE status = 'pending';

CREATE INDEX idx_pending_claims_user ON pending_claims(user_id, created_at DESC);
CREATE INDEX idx_pending_claims_contact_email ON pending_claims(contact_email)
  WHERE status = 'pending' AND contact_email IS NOT NULL;
CREATE INDEX idx_pending_claims_expires ON pending_claims(expires_at)
  WHERE status = 'pending';

ALTER TABLE pending_claims ENABLE ROW LEVEL SECURITY;
-- No policies = service-role only. Edge Functions are the only writer/reader.

-- ============================================================
-- 2. candidate_registry
-- ============================================================
CREATE TABLE candidate_registry (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level                  TEXT NOT NULL CHECK (level IN ('federal', 'state', 'local')),
  filing_id              TEXT NOT NULL,
  name                   TEXT NOT NULL,
  normalized_name        TEXT,
  race_id                TEXT,
  party                  TEXT,
  email_on_file          TEXT,
  social_handles_on_file JSONB,
  source                 TEXT NOT NULL CHECK (source IN ('fec', 'ballotpedia', 'ga_sos')),
  last_verified_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source, filing_id)
);

CREATE INDEX idx_registry_filing_id ON candidate_registry(filing_id);
CREATE INDEX idx_registry_normalized_name ON candidate_registry(normalized_name);
CREATE INDEX idx_registry_level_source ON candidate_registry(level, source);

ALTER TABLE candidate_registry ENABLE ROW LEVEL SECURITY;
-- No policies = service-role only.

-- ============================================================
-- 3. Audit trigger: pending_claims transitions
-- ============================================================
CREATE OR REPLACE FUNCTION audit_pending_claim()
RETURNS TRIGGER AS $$
DECLARE
  evt TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (event_type, actor_id, target_table, target_id, new_value, metadata)
    VALUES (
      'claim.verification_attempted',
      NEW.user_id,
      'pending_claims',
      NEW.candidate_id::TEXT,
      jsonb_build_object(
        'verification_method', NEW.verification_method,
        'level',               NEW.level,
        'filing_id',           NEW.filing_id
      ),
      jsonb_build_object('pending_claim_id', NEW.id)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    evt := CASE NEW.status
      WHEN 'verified' THEN 'claim.verification_succeeded'
      WHEN 'expired'  THEN 'claim.verification_expired'
      WHEN 'revoked'  THEN 'claim.verification_revoked'
      WHEN 'failed'   THEN 'claim.verification_failed'
      ELSE                 'claim.verification_other'
    END;
    INSERT INTO audit_log (event_type, actor_id, target_table, target_id, old_value, new_value, metadata)
    VALUES (
      evt,
      auth.uid(),
      'pending_claims',
      NEW.candidate_id::TEXT,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status),
      jsonb_build_object(
        'pending_claim_id',    NEW.id,
        'verification_method', NEW.verification_method
      )
    );
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_audit_pending_claim
  AFTER INSERT OR UPDATE ON pending_claims
  FOR EACH ROW EXECUTE FUNCTION audit_pending_claim();

-- ============================================================
-- 4. Expire pending_claims past their TTL.
-- Runs every 5 minutes; at 30-min TTL this means a claim spends at most
-- ~5min in the "stale-but-not-expired" gap. Cheap because the partial
-- index makes the scan tiny (only currently-pending rows).
-- ============================================================
CREATE OR REPLACE FUNCTION expire_stale_pending_claims()
RETURNS VOID AS $$
BEGIN
  UPDATE pending_claims
     SET status = 'expired'
   WHERE status = 'pending'
     AND expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'pending-claims-expire') THEN
    PERFORM cron.unschedule('pending-claims-expire');
  END IF;
END $$;

SELECT cron.schedule(
  'pending-claims-expire',
  '*/5 * * * *',
  $$SELECT public.expire_stale_pending_claims()$$
);

-- ============================================================
-- 5. Sybil revoke: set candidate back to unclaimed and clear the claim.
-- Service-role only; called by /admin/dedup. Wraps the two writes so
-- the audit_log captures both the claim deletion and the status flip
-- atomically.
-- ============================================================
CREATE OR REPLACE FUNCTION revoke_candidate_claim(
  p_candidate_id UUID,
  p_reason       TEXT
)
RETURNS VOID AS $$
DECLARE
  claim_user UUID;
BEGIN
  SELECT user_id INTO claim_user
    FROM candidate_claims
   WHERE candidate_id = p_candidate_id;

  IF claim_user IS NULL THEN
    RAISE EXCEPTION 'No claim found for candidate %', p_candidate_id;
  END IF;

  DELETE FROM candidate_claims WHERE candidate_id = p_candidate_id;

  UPDATE candidates
     SET status = 'unclaimed'
   WHERE id = p_candidate_id;

  INSERT INTO audit_log (event_type, actor_id, target_table, target_id, new_value, metadata)
  VALUES (
    'claim.revoked',
    auth.uid(),
    'candidate_claims',
    p_candidate_id::TEXT,
    jsonb_build_object('reason', p_reason),
    jsonb_build_object('revoked_user_id', claim_user)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION revoke_candidate_claim(UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION revoke_candidate_claim(UUID, TEXT) FROM anon, authenticated;
