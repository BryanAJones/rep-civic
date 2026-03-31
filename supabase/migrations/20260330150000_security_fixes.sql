-- Security fixes identified during pre-deploy review.

-- ============================================================
-- 1. Fix conflicting RLS on question_votes
-- Migration 1 granted SELECT to everyone; migration 3 added
-- per-user SELECT. The blanket policy makes votes public.
-- Drop the blanket policy so only own-votes are readable.
-- ============================================================
DROP POLICY "Public read: question_votes" ON question_votes;

-- ============================================================
-- 2. Lock down increment_plus_one RPC
-- Without this, any client can inflate vote counts directly,
-- bypassing the vote-dedup in the Edge Function.
-- ============================================================
REVOKE EXECUTE ON FUNCTION increment_plus_one FROM anon, authenticated;

-- ============================================================
-- 3. Secure upgrade_user_profile
-- Previous version accepted any p_user_id, allowing any caller
-- to overwrite another user's email. Restrict to own profile.
-- ============================================================
CREATE OR REPLACE FUNCTION upgrade_user_profile(
  p_user_id UUID,
  p_email TEXT
)
RETURNS void AS $$
  UPDATE user_profiles
  SET email = p_email, is_anonymous = false
  WHERE id = p_user_id
    AND id = auth.uid();
$$ LANGUAGE sql VOLATILE SECURITY DEFINER;

-- ============================================================
-- 4. Denormalized counter triggers
-- candidates.question_count and candidates.video_count are
-- never maintained — they always read 0. Add triggers.
-- ============================================================

-- 4a. Increment question_count on new question
CREATE OR REPLACE FUNCTION increment_candidate_question_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE candidates
  SET question_count = question_count + 1
  WHERE id = NEW.candidate_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_increment_question_count
  AFTER INSERT ON questions
  FOR EACH ROW
  EXECUTE FUNCTION increment_candidate_question_count();

-- 4b. Increment video_count on new video
CREATE OR REPLACE FUNCTION increment_candidate_video_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE candidates
  SET video_count = video_count + 1
  WHERE id = NEW.candidate_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_increment_video_count
  AFTER INSERT ON videos
  FOR EACH ROW
  EXECUTE FUNCTION increment_candidate_video_count();
