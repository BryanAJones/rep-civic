-- ============================================================
-- Item 84 reversal: wipe the generic editorially-written seeds
--
-- The 12 templates were made up without research and applied
-- uniformly per district level, which produced leading framing
-- (e.g. Medicaid expansion seeded under every GA legislator
-- regardless of party) and lazy cross-office reuse (school board
-- candidates and city council candidates getting the same questions).
--
-- This migration removes the data but KEEPS the infrastructure:
--   - questions.is_seed column stays
--   - seed_question_templates table stays (cleared)
--   - seed_questions_for_candidate(uuid) function stays
--   - AFTER INSERT trigger on candidates stays
--
-- The next iteration will populate seeds algorithmically from
-- real candidate-specific signals (bills sponsored, committees,
-- candidate_positions, district context) rather than guesses.
-- ============================================================

-- 1. Decrement the denormalized question_count by the number of
-- seeds about to be deleted for each candidate.
WITH per_candidate AS (
  SELECT candidate_id, COUNT(*)::INT AS seed_count
  FROM questions
  WHERE is_seed = TRUE
  GROUP BY candidate_id
)
UPDATE candidates c
   SET question_count = GREATEST(0, c.question_count - p.seed_count),
       updated_at = now()
  FROM per_candidate p
 WHERE c.id = p.candidate_id;

-- 2. Drop all seed-flagged questions
DELETE FROM questions WHERE is_seed = TRUE;

-- 3. Empty the templates table — leave the table itself in place
-- so the next iteration can repopulate without re-creating the schema.
DELETE FROM seed_question_templates;
