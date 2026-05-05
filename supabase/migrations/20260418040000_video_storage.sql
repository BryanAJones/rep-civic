-- Item 67: Candidate dashboard — video answer storage.
-- A claimed candidate uploads an mp4 in reply to a question. The bucket is
-- public-read (videos are public content) but write access is gated to the
-- user who owns the candidate_claim matching the path's candidate_id prefix.

-- ============================================================
-- 1. Storage bucket
-- ============================================================
-- 100MB per-file ceiling lines up with Supabase free-tier limits and keeps
-- the upload UX honest: if it doesn't fit, the candidate films something
-- shorter rather than waiting on a transcoding pipeline we haven't built.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'candidate-videos',
  'candidate-videos',
  true,
  104857600,
  ARRAY['video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================
-- 2. Storage RLS — read public, write claimed-candidate-only
-- ============================================================
-- Path convention: <candidate_id>/<video_id>.<ext>
-- The first slash-segment is the candidate_id; we check that auth.uid() owns
-- a claim for that candidate. split_part is null-safe and avoids regex cost.

CREATE POLICY "Public read: candidate-videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'candidate-videos');

CREATE POLICY "Claimed candidate inserts own videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'candidate-videos'
    AND EXISTS (
      SELECT 1 FROM public.candidate_claims c
      WHERE c.user_id = auth.uid()
        AND c.candidate_id::TEXT = split_part(name, '/', 1)
    )
  );

CREATE POLICY "Claimed candidate updates own videos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'candidate-videos'
    AND EXISTS (
      SELECT 1 FROM public.candidate_claims c
      WHERE c.user_id = auth.uid()
        AND c.candidate_id::TEXT = split_part(name, '/', 1)
    )
  );

CREATE POLICY "Claimed candidate deletes own videos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'candidate-videos'
    AND EXISTS (
      SELECT 1 FROM public.candidate_claims c
      WHERE c.user_id = auth.uid()
        AND c.candidate_id::TEXT = split_part(name, '/', 1)
    )
  );
