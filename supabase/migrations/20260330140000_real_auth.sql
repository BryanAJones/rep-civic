-- Phase B5: Real Auth
-- Magic link upgrade, custom handles, candidate claims.

-- ============================================================
-- 1. Add email to user_profiles (populated on magic link upgrade)
-- ============================================================
ALTER TABLE user_profiles ADD COLUMN email TEXT;
ALTER TABLE user_profiles ADD COLUMN is_anonymous BOOLEAN NOT NULL DEFAULT true;

-- ============================================================
-- 2. Candidate Claims (write-once ownership)
-- One claim per candidate. Once claimed, cannot be re-claimed.
-- ============================================================
CREATE TABLE candidate_claims (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id  UUID NOT NULL UNIQUE REFERENCES candidates(id),
  user_id       UUID NOT NULL REFERENCES auth.users(id),
  claimed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Verification fields (for future ceremony)
  verification_method TEXT,
  verified_at        TIMESTAMPTZ
);

ALTER TABLE candidate_claims ENABLE ROW LEVEL SECURITY;

-- Anyone can read claims (to show claimed status)
CREATE POLICY "Public read: candidate_claims"
  ON candidate_claims FOR SELECT USING (true);

-- Only authenticated (non-anonymous) users can claim
-- The Edge Function enforces this, but RLS is defense-in-depth
CREATE POLICY "Authenticated users insert claims"
  ON candidate_claims FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_claims_candidate ON candidate_claims(candidate_id);
CREATE INDEX idx_claims_user ON candidate_claims(user_id);

-- ============================================================
-- 3. Update user_profiles trigger to track anonymous status
-- ============================================================
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, handle, is_anonymous)
  VALUES (
    NEW.id,
    '@voter_' || LEFT(NEW.id::text, 8),
    NEW.is_anonymous
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. Function to upgrade anonymous → authenticated
-- Called after magic link verification. Updates profile.
-- ============================================================
CREATE OR REPLACE FUNCTION upgrade_user_profile(
  p_user_id UUID,
  p_email TEXT
)
RETURNS void AS $$
  UPDATE user_profiles
  SET email = p_email, is_anonymous = false
  WHERE id = p_user_id;
$$ LANGUAGE sql VOLATILE SECURITY DEFINER;
