-- S-8: Handle reservation policy.
-- Block candidate-name squatting by reserving handle variants derived from
-- candidate names. A reserved handle can only be taken by a user who already
-- holds the matching candidate_claims row.

-- ============================================================
-- 1. reserved_handles table
-- ============================================================
CREATE TABLE reserved_handles (
  handle        TEXT PRIMARY KEY,
  candidate_id  UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  reason        TEXT NOT NULL DEFAULT 'candidate_auto',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reserved_handles_candidate ON reserved_handles(candidate_id);

ALTER TABLE reserved_handles ENABLE ROW LEVEL SECURITY;

-- Anyone can SELECT so the client can pre-check availability without
-- leaking anything sensitive (handle + candidate_id only).
CREATE POLICY "Public read: reserved_handles"
  ON reserved_handles FOR SELECT USING (true);

-- INSERT/UPDATE/DELETE restricted to service_role only (used by seed script
-- and claim-candidate Edge Function). No policy = RLS denies by default.

-- ============================================================
-- 2. Trigger enforcing reservation on user_profiles.handle updates
-- ============================================================
CREATE OR REPLACE FUNCTION enforce_handle_reservation()
RETURNS TRIGGER AS $$
DECLARE
  reserved_candidate UUID;
  claimant UUID;
BEGIN
  -- No-op when the handle isn't changing.
  IF NEW.handle IS NOT DISTINCT FROM OLD.handle THEN
    RETURN NEW;
  END IF;

  SELECT candidate_id
    INTO reserved_candidate
    FROM reserved_handles
   WHERE handle = lower(NEW.handle);

  IF reserved_candidate IS NULL THEN
    RETURN NEW;
  END IF;

  -- Handle is reserved. Allow only if the updating user already owns
  -- the matching candidate claim.
  SELECT user_id
    INTO claimant
    FROM candidate_claims
   WHERE candidate_id = reserved_candidate;

  IF claimant IS NOT NULL AND claimant = NEW.id THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'handle % is reserved for a candidate', NEW.handle
    USING ERRCODE = 'P0001';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_enforce_handle_reservation
  BEFORE UPDATE OF handle ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION enforce_handle_reservation();
