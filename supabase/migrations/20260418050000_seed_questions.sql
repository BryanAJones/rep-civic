-- ============================================================
-- Item 84: Editorial seed questions per district level
--
-- Seeds 3 generic-but-useful starter questions under every candidate,
-- keyed by their district level (federal, state, county, city).
-- Marked with is_seed = TRUE so the UI can show a "Suggested by Rep."
-- badge. Real organic +1s elevate them naturally; without seeds, every
-- claimed candidate's dashboard inbox would start empty.
-- ============================================================

-- 1. Add is_seed column to questions
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS is_seed BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_questions_is_seed
  ON questions(candidate_id) WHERE is_seed = TRUE;

-- 2. Template table — editable in the dashboard later
CREATE TABLE IF NOT EXISTS seed_question_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_level  TEXT NOT NULL CHECK (district_level IN ('federal', 'state', 'county', 'city')),
  text            TEXT NOT NULL,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (district_level, text)
);

ALTER TABLE seed_question_templates ENABLE ROW LEVEL SECURITY;
-- Public read: clients may want to display the catalog later.
CREATE POLICY seed_question_templates_select ON seed_question_templates
  FOR SELECT USING (TRUE);
-- Writes are service-role only (admin-curated).

-- 3. Author handle for seeds — distinct, identifiable, never collides with real users
INSERT INTO seed_question_templates (district_level, text, sort_order) VALUES
  ('federal', 'What is your top legislative priority for your first 100 days?', 1),
  ('federal', 'How would you reduce healthcare costs for working families in our district?', 2),
  ('federal', 'Where do you stand on bipartisan reforms to immigration policy?', 3),
  ('state',   'What is your position on expanding Medicaid in Georgia?', 1),
  ('state',   'How would you fund public schools without raising property taxes?', 2),
  ('state',   'What is your top priority for the next legislative session?', 3),
  ('county',  'What is the biggest infrastructure problem in our county right now?', 1),
  ('county',  'How would you balance the county budget if revenue falls short?', 2),
  ('county',  'What is your plan for affordable housing in our area?', 3),
  ('city',    'What is your top priority for our city this year?', 1),
  ('city',    'Where do you stand on local property tax policy?', 2),
  ('city',    'How would you improve city services for residents?', 3)
ON CONFLICT (district_level, text) DO NOTHING;

-- 4. Function to seed questions for a single candidate (idempotent)
CREATE OR REPLACE FUNCTION seed_questions_for_candidate(p_candidate_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_level TEXT;
  v_inserted INT := 0;
BEGIN
  SELECT d.level INTO v_level
  FROM candidates c
  JOIN districts d ON c.district_code = d.code
  WHERE c.id = p_candidate_id;

  IF v_level IS NULL THEN
    RETURN 0;
  END IF;

  WITH inserted AS (
    INSERT INTO questions (candidate_id, text, author_handle, plus_one_count, state, is_seed)
    SELECT p_candidate_id, t.text, '@rep_team', 0, 'default', TRUE
    FROM seed_question_templates t
    WHERE t.district_level = v_level
      AND NOT EXISTS (
        SELECT 1 FROM questions q
        WHERE q.candidate_id = p_candidate_id
          AND q.is_seed = TRUE
          AND q.text = t.text
      )
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_inserted FROM inserted;

  -- Keep the denormalized question_count counter in sync
  IF v_inserted > 0 THEN
    UPDATE candidates
       SET question_count = question_count + v_inserted,
           updated_at = now()
     WHERE id = p_candidate_id;
  END IF;

  RETURN v_inserted;
END;
$$;

-- 5. Backfill every existing candidate
DO $$
DECLARE
  c RECORD;
  per_count INT;
  total INT := 0;
BEGIN
  FOR c IN SELECT id FROM candidates LOOP
    SELECT seed_questions_for_candidate(c.id) INTO per_count;
    total := total + per_count;
  END LOOP;
  RAISE NOTICE 'Seeded % questions across all existing candidates', total;
END $$;

-- 6. Auto-seed on new candidate inserts (covers nightly imports)
CREATE OR REPLACE FUNCTION trigger_seed_questions_after_candidate_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM seed_questions_for_candidate(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS candidates_seed_questions_after_insert ON candidates;
CREATE TRIGGER candidates_seed_questions_after_insert
AFTER INSERT ON candidates
FOR EACH ROW
EXECUTE FUNCTION trigger_seed_questions_after_candidate_insert();
