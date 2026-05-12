-- B6-5 Phase 5a: Social-handle fallback for candidates without on-file email.
--
-- The B6-1 ceremony already generated a 9-char proof code and stashed it in
-- pending_claims.social_proof_code when no FEC email was on file. What was
-- missing: a place for the claimant to tell us WHERE they posted the code,
-- and a controlled path for an admin to approve the proof.
--
-- This migration adds:
--   1. social_proof_url and social_proof_submitted_at columns on
--      pending_claims (claimant submits the URL after posting the code).
--   2. approve_social_proof RPC — service-role-only function that wraps
--      the promote + insert + flip transaction so an admin can approve
--      from CLI or admin UI without re-implementing the finalize logic.
--   3. reject_social_proof RPC for the symmetric case.
--
-- Audit hooks: the existing audit_pending_claim trigger already writes
-- claim.verification_{succeeded,failed} on status transitions, so both
-- approve and reject paths flow into audit_log automatically.

-- ============================================================
-- 1. New columns on pending_claims
-- ============================================================
ALTER TABLE pending_claims
  ADD COLUMN social_proof_url           TEXT,
  ADD COLUMN social_proof_submitted_at  TIMESTAMPTZ;

-- Admin queue index: pending social_proof rows with a URL submitted are
-- the actionable set. social_proof_url IS NOT NULL distinguishes
-- "awaiting post" from "awaiting review" without overloading status.
CREATE INDEX idx_pending_claims_social_proof_queue
  ON pending_claims(social_proof_submitted_at DESC)
  WHERE status = 'pending'
    AND verification_method = 'social_proof'
    AND social_proof_url IS NOT NULL;

-- ============================================================
-- 2. approve_social_proof — service-role-only
-- ============================================================
-- Promotes a pending social_proof row to verified, inserts the
-- candidate_claims row using the ORIGINAL claimant's user_id (not the
-- admin's), and flips candidates.status to 'claimed'. Idempotent guard:
-- only runs if the pending row is still status='pending'.

CREATE OR REPLACE FUNCTION approve_social_proof(
  p_pending_claim_id UUID,
  p_admin_note       TEXT DEFAULT NULL
)
RETURNS TABLE (
  candidate_id   UUID,
  candidate_name TEXT,
  user_id        UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pending RECORD;
  v_cand    RECORD;
BEGIN
  SELECT id, candidate_id, user_id, verification_method, status, social_proof_url
    INTO v_pending
    FROM pending_claims
   WHERE id = p_pending_claim_id;

  IF v_pending IS NULL THEN
    RAISE EXCEPTION 'pending_claim % not found', p_pending_claim_id;
  END IF;
  IF v_pending.verification_method <> 'social_proof' THEN
    RAISE EXCEPTION 'pending_claim % is not a social_proof claim', p_pending_claim_id;
  END IF;
  IF v_pending.status <> 'pending' THEN
    RAISE EXCEPTION 'pending_claim % is in status %, expected pending', p_pending_claim_id, v_pending.status;
  END IF;
  IF v_pending.social_proof_url IS NULL THEN
    RAISE EXCEPTION 'pending_claim % has no submitted proof URL', p_pending_claim_id;
  END IF;

  -- Promote (audit trigger fires)
  UPDATE pending_claims
     SET status = 'verified',
         verified_at = now()
   WHERE id = p_pending_claim_id
     AND status = 'pending';

  -- Insert claim (audit trigger fires)
  INSERT INTO candidate_claims (candidate_id, user_id, verification_method, verified_at)
  VALUES (v_pending.candidate_id, v_pending.user_id, 'social_proof', now());

  -- Flip candidate status
  UPDATE candidates
     SET status = 'claimed'
   WHERE id = v_pending.candidate_id
     AND status = 'unclaimed';

  -- Free-form admin note → audit_log
  INSERT INTO audit_log (event_type, actor_id, target_table, target_id, new_value, metadata)
  VALUES (
    'claim.social_proof_approved',
    auth.uid(),
    'pending_claims',
    p_pending_claim_id::TEXT,
    jsonb_build_object('candidate_id', v_pending.candidate_id, 'user_id', v_pending.user_id),
    jsonb_build_object('admin_note', p_admin_note, 'proof_url', v_pending.social_proof_url)
  );

  SELECT id, name INTO v_cand FROM candidates WHERE id = v_pending.candidate_id;
  candidate_id   := v_cand.id;
  candidate_name := v_cand.name;
  user_id        := v_pending.user_id;
  RETURN NEXT;
END;
$$;

REVOKE EXECUTE ON FUNCTION approve_social_proof(UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION approve_social_proof(UUID, TEXT) FROM anon, authenticated;

-- ============================================================
-- 3. reject_social_proof — service-role-only
-- ============================================================
CREATE OR REPLACE FUNCTION reject_social_proof(
  p_pending_claim_id UUID,
  p_reason           TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pending RECORD;
BEGIN
  SELECT id, candidate_id, user_id, verification_method, status, social_proof_url
    INTO v_pending
    FROM pending_claims
   WHERE id = p_pending_claim_id;

  IF v_pending IS NULL THEN
    RAISE EXCEPTION 'pending_claim % not found', p_pending_claim_id;
  END IF;
  IF v_pending.verification_method <> 'social_proof' THEN
    RAISE EXCEPTION 'pending_claim % is not a social_proof claim', p_pending_claim_id;
  END IF;
  IF v_pending.status <> 'pending' THEN
    RAISE EXCEPTION 'pending_claim % is in status %, expected pending', p_pending_claim_id, v_pending.status;
  END IF;

  UPDATE pending_claims
     SET status = 'failed'
   WHERE id = p_pending_claim_id
     AND status = 'pending';

  INSERT INTO audit_log (event_type, actor_id, target_table, target_id, new_value, metadata)
  VALUES (
    'claim.social_proof_rejected',
    auth.uid(),
    'pending_claims',
    p_pending_claim_id::TEXT,
    jsonb_build_object('candidate_id', v_pending.candidate_id, 'user_id', v_pending.user_id),
    jsonb_build_object('reason', p_reason, 'proof_url', v_pending.social_proof_url)
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION reject_social_proof(UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION reject_social_proof(UUID, TEXT) FROM anon, authenticated;
