-- Google Civic voterInfoQuery integration — schema + backfill.
-- Part of the hybrid ballot architecture: baseline (Congress/OpenStates)
-- stays authoritative for incumbent identity; Google enriches contact
-- fields during active election windows. See CEO review artifact at
-- ~/.gstack/projects/BryanAJones-rep-civic/ceo-plans/voterinfo-ceo-review.md.

-- ============================================================
-- 1. candidates: enrichment + dedup columns
--    NOTE: campaign_url already exists — do NOT add candidate_url.
-- ============================================================
ALTER TABLE candidates
  ADD COLUMN phone              TEXT,
  ADD COLUMN email              TEXT,
  ADD COLUMN photo_url          TEXT,
  ADD COLUMN sources            TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN google_person_id   TEXT,
  ADD COLUMN normalized_name    TEXT,
  ADD COLUMN needs_manual_dedup BOOLEAN NOT NULL DEFAULT false;

-- ============================================================
-- 2. districts: Google scope + provenance
-- ============================================================
ALTER TABLE districts
  ADD COLUMN scope       TEXT,
  ADD COLUMN external_id TEXT,
  ADD COLUMN source      TEXT NOT NULL DEFAULT 'geocodio';

-- ============================================================
-- 3. voterinfo_cache: deduped, TTL-bounded Google responses
--    No RLS — service_role access only via Edge Function.
-- ============================================================
CREATE TABLE voterinfo_cache (
  address_hash    TEXT PRIMARY KEY,
  payload         JSONB NOT NULL,
  district_codes  TEXT[] NOT NULL,
  election_date   DATE,
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_voterinfo_cache_expires ON voterinfo_cache(expires_at);

-- ============================================================
-- 4. normalize_candidate_name(): plpgsql mirror of src/utils/normalizeName.ts.
--    Kept in sync via normalizeName.test.ts + the parity harness that runs
--    real Congress.gov names through both implementations.
-- ============================================================
CREATE OR REPLACE FUNCTION normalize_candidate_name(input TEXT) RETURNS TEXT AS $$
DECLARE
  s       TEXT;
  last    TEXT;
  first   TEXT;
  comma   INT;
  tokens  TEXT[];
  t       TEXT;
  result  TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF input IS NULL OR btrim(input) = '' THEN
    RETURN '';
  END IF;

  s := lower(input);

  -- "Smith, John D." → "John D. Smith"
  comma := position(',' in s);
  IF comma > 0 THEN
    last := btrim(substring(s for comma - 1));
    first := btrim(substring(s from comma + 1));
    s := btrim(first || ' ' || last);
  END IF;

  -- Strip punctuation, keep letters/digits/spaces/hyphens. Postgres regex
  -- POSIX classes are locale-aware on UTF-8 databases, so Unicode letters
  -- (e.g., accented characters) survive.
  s := regexp_replace(s, '[^[:alnum:][:space:]-]', '', 'g');

  tokens := regexp_split_to_array(s, '\s+');
  FOREACH t IN ARRAY tokens LOOP
    IF length(t) > 1 AND t NOT IN ('jr','sr','ii','iii','iv','v') THEN
      result := array_append(result, t);
    END IF;
  END LOOP;

  RETURN btrim(array_to_string(result, ' '));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- 5. Backfill normalized_name for every existing candidate.
-- ============================================================
UPDATE candidates
   SET normalized_name = normalize_candidate_name(name)
 WHERE normalized_name IS NULL;

-- ============================================================
-- 6. Backfill sources array from existing row shape.
--    Congress bioguide IDs: 1 letter + 6 digits, e.g. "O000174".
--    OpenStates IDs: prefixed "ocd-person/".
--    Everything else with a filing_id: FEC.
-- ============================================================
UPDATE candidates
   SET sources = ARRAY['openstates']
 WHERE filing_id LIKE 'ocd-person/%'
   AND sources = '{}';

UPDATE candidates
   SET sources = ARRAY['congress']
 WHERE filing_id ~ '^[A-Z][0-9]{6}$'
   AND sources = '{}';

UPDATE candidates
   SET sources = ARRAY['fec']
 WHERE filing_id IS NOT NULL
   AND sources = '{}';

-- ============================================================
-- 7. Unique partial index enforcing (normalized_name, district_code)
--    identity. Partial on needs_manual_dedup=false so operators can
--    mark genuinely-ambiguous rows (father/son in same district) and
--    unblock ingestion.
-- ============================================================
CREATE UNIQUE INDEX ux_candidates_normname_district
    ON candidates (normalized_name, district_code)
 WHERE needs_manual_dedup = false
   AND normalized_name IS NOT NULL;

CREATE INDEX idx_candidates_normname ON candidates (normalized_name);
CREATE INDEX idx_candidates_dedup_flag ON candidates (needs_manual_dedup) WHERE needs_manual_dedup = true;

-- Nightly cache cleanup via pg_cron is scheduled in the commit-4 migration
-- (admin/observability surfaces). Until then, the Edge Function cleans up
-- expired rows opportunistically on every call.
