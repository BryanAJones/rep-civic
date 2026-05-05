-- ============================================================
-- Add durable ownership to questions.
--
-- Previously questions only stored `author_handle` (TEXT), so if a
-- user lost their device-scoped anonymous session (cleared browser,
-- reinstalled PWA) their questions became orphans — the handle
-- string survived but no user_id tied the row to a recoverable
-- account.
--
-- `asked_by` is nullable to preserve existing rows. New inserts
-- (gated on non-anonymous auth by submit-question) will always
-- stamp it. ON DELETE SET NULL keeps the question visible if the
-- auth user is later deleted.
-- ============================================================

-- IF NOT EXISTS guards: prod already received this column via a dashboard
-- SQL run on 2026-04-19 (timestamp 20260419163957). The repair table marks
-- this migration applied without re-running. The guards keep this file
-- safe for any future fresh-prod replay.
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS asked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_questions_asked_by ON questions(asked_by) WHERE asked_by IS NOT NULL;
