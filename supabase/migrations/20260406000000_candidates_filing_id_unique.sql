-- Add unique constraint on filing_id to support upsert in import:seed
ALTER TABLE candidates ADD CONSTRAINT candidates_filing_id_unique UNIQUE (filing_id);
