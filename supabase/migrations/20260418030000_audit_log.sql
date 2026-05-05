-- S-19: Audit log for candidate state transitions.
-- Append-only log of sensitive writes: candidate status changes, claims,
-- and handle changes. Service-role-only reads via RLS default-deny.
-- Triggers run SECURITY DEFINER so they can insert into audit_log even
-- when the caller's role (authenticated) has no write policy on the table.

-- ============================================================
-- 1. audit_log table
-- ============================================================
CREATE TABLE audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_type    TEXT NOT NULL,
  actor_id      UUID,
  target_table  TEXT NOT NULL,
  target_id     TEXT,
  old_value     JSONB,
  new_value     JSONB,
  metadata      JSONB
);

CREATE INDEX idx_audit_log_occurred_at ON audit_log(occurred_at DESC);
CREATE INDEX idx_audit_log_event_type ON audit_log(event_type, occurred_at DESC);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_id, occurred_at DESC)
  WHERE actor_id IS NOT NULL;
CREATE INDEX idx_audit_log_target ON audit_log(target_table, target_id);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
-- No policies: RLS denies anon + authenticated. Only service_role reads.

-- ============================================================
-- 2. Trigger: candidate status transitions
-- ============================================================
CREATE OR REPLACE FUNCTION audit_candidate_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO audit_log (event_type, actor_id, target_table, target_id, old_value, new_value)
    VALUES (
      'candidate.status_changed',
      auth.uid(),
      'candidates',
      NEW.id::TEXT,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_audit_candidate_status
  AFTER UPDATE OF status ON candidates
  FOR EACH ROW EXECUTE FUNCTION audit_candidate_status();

-- ============================================================
-- 3. Trigger: candidate_claims insert/delete
-- ============================================================
CREATE OR REPLACE FUNCTION audit_candidate_claim()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (event_type, actor_id, target_table, target_id, new_value, metadata)
    VALUES (
      'candidate.claimed',
      NEW.user_id,
      'candidate_claims',
      NEW.candidate_id::TEXT,
      jsonb_build_object(
        'user_id', NEW.user_id,
        'verification_method', NEW.verification_method
      ),
      jsonb_build_object('claim_id', NEW.id)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (event_type, actor_id, target_table, target_id, old_value, metadata)
    VALUES (
      'candidate.unclaimed',
      auth.uid(),
      'candidate_claims',
      OLD.candidate_id::TEXT,
      jsonb_build_object(
        'user_id', OLD.user_id,
        'verification_method', OLD.verification_method
      ),
      jsonb_build_object('claim_id', OLD.id)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_audit_candidate_claim
  AFTER INSERT OR DELETE ON candidate_claims
  FOR EACH ROW EXECUTE FUNCTION audit_candidate_claim();

-- ============================================================
-- 4. Trigger: user_profiles handle changes
-- ============================================================
CREATE OR REPLACE FUNCTION audit_handle_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.handle IS DISTINCT FROM OLD.handle THEN
    INSERT INTO audit_log (event_type, actor_id, target_table, target_id, old_value, new_value)
    VALUES (
      'user.handle_changed',
      NEW.id,
      'user_profiles',
      NEW.id::TEXT,
      jsonb_build_object('handle', OLD.handle),
      jsonb_build_object('handle', NEW.handle)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_audit_handle_change
  AFTER UPDATE OF handle ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION audit_handle_change();

-- ============================================================
-- 5. Retention: 1-year cleanup via pg_cron
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'audit-log-cleanup') THEN
    PERFORM cron.unschedule('audit-log-cleanup');
  END IF;
END $$;

SELECT cron.schedule(
  'audit-log-cleanup',
  '23 3 * * *',
  $$DELETE FROM public.audit_log WHERE occurred_at < now() - interval '1 year'$$
);
