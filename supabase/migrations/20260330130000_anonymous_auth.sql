-- Phase B4: Anonymous Identity
-- Enables anonymous auth, user_profiles, and vote ownership via RLS.

-- ============================================================
-- 1. User Profiles
-- Auto-created on signup via trigger. Handle format: @voter_<short_id>
-- ============================================================
CREATE TABLE user_profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle     TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read any profile (for displaying handles)
CREATE POLICY "Public read: user_profiles"
  ON user_profiles FOR SELECT USING (true);

-- Users can update only their own profile
CREATE POLICY "Users update own profile"
  ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- 2. Auto-create user_profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, handle)
  VALUES (NEW.id, '@voter_' || LEFT(NEW.id::text, 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_create_user_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- ============================================================
-- 3. RLS on question_votes: INSERT requires auth match
-- ============================================================
CREATE POLICY "Authenticated users insert own votes"
  ON question_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own votes (for hydrating votedQuestionIds)
CREATE POLICY "Users read own votes"
  ON question_votes FOR SELECT
  USING (auth.uid() = user_id);
