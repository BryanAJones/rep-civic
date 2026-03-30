-- Atomic increment for question vote counts.
-- Returns the new plus_one_count after increment.
CREATE OR REPLACE FUNCTION increment_plus_one(qid UUID)
RETURNS INT AS $$
  UPDATE questions
  SET plus_one_count = plus_one_count + 1
  WHERE id = qid
  RETURNING plus_one_count;
$$ LANGUAGE sql VOLATILE;
