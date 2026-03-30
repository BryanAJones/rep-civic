/**
 * Seed Supabase with transformed district + candidate data.
 *
 * Reads:  scripts/import/data/districts.json
 *         scripts/import/data/candidates.json
 * Writes: Inserts rows into Supabase `districts` and `candidates` tables.
 *
 * Requires environment variables:
 *   SUPABASE_URL          — Supabase project URL
 *   SUPABASE_SERVICE_KEY  — service_role key (NOT the anon key)
 *
 * Usage: SUPABASE_URL=... SUPABASE_SERVICE_KEY=... npm run import:seed
 *
 * The script uses upsert (ON CONFLICT) so it's safe to re-run.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import type { DistrictRow, CandidateRow } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables:');
  console.error('  SUPABASE_URL          — your Supabase project URL');
  console.error('  SUPABASE_SERVICE_KEY  — service_role key (from Dashboard → Settings → API)');
  console.error('\nUsage: SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_KEY=eyJ... npm run import:seed');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

async function seedDistricts(districts: DistrictRow[]): Promise<void> {
  console.log(`Seeding ${districts.length} districts...`);

  // Batch in groups of 50
  const batchSize = 50;
  let inserted = 0;

  for (let i = 0; i < districts.length; i += batchSize) {
    const batch = districts.slice(i, i + batchSize);
    const { error } = await supabase
      .from('districts')
      .upsert(batch, { onConflict: 'code' });

    if (error) {
      console.error(`  Error at batch ${i}:`, error.message);
      throw error;
    }
    inserted += batch.length;
  }

  console.log(`  Upserted ${inserted} districts`);
}

async function seedCandidates(candidates: CandidateRow[]): Promise<void> {
  console.log(`Seeding ${candidates.length} candidates...`);

  // Batch in groups of 50
  const batchSize = 50;
  let inserted = 0;

  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    const { error } = await supabase
      .from('candidates')
      .upsert(batch, { onConflict: 'filing_id' });

    if (error) {
      console.error(`  Error at batch ${i}:`, error.message);
      throw error;
    }
    inserted += batch.length;
  }

  console.log(`  Upserted ${inserted} candidates`);
}

async function main() {
  console.log('=== Rep. Data Import — Seed ===\n');

  const districts: DistrictRow[] = JSON.parse(
    readFileSync(join(DATA_DIR, 'districts.json'), 'utf-8')
  );
  const candidates: CandidateRow[] = JSON.parse(
    readFileSync(join(DATA_DIR, 'candidates.json'), 'utf-8')
  );

  console.log(`Loaded ${districts.length} districts, ${candidates.length} candidates\n`);

  // Districts must be seeded first (candidates reference district_code FK)
  await seedDistricts(districts);
  await seedCandidates(candidates);

  // Verify counts
  const { count: distCount } = await supabase
    .from('districts')
    .select('*', { count: 'exact', head: true });
  const { count: candCount } = await supabase
    .from('candidates')
    .select('*', { count: 'exact', head: true });

  console.log(`\nVerification:`);
  console.log(`  districts table: ${distCount} rows`);
  console.log(`  candidates table: ${candCount} rows`);
  console.log('\nDone.');
}

main().catch((err) => {
  console.error('\nSeed failed:', err.message);
  process.exit(1);
});
