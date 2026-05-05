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

// Accept either SUPABASE_URL (server-style) or VITE_SUPABASE_URL (the one
// already set in .env for the client). Same value, different prefix.
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables:');
  console.error('  SUPABASE_URL or VITE_SUPABASE_URL — your Supabase project URL');
  console.error('  SUPABASE_SERVICE_KEY              — service_role key (from Dashboard → Settings → API)');
  console.error('\nAdd SUPABASE_SERVICE_KEY=eyJ... to .env (scripts use --env-file=.env).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

async function cleanupBeforeSeed(): Promise<void> {
  console.log('Cleaning up unclaimed candidates before re-seed...');
  const { error, count } = await supabase
    .from('candidates')
    .delete()
    .eq('status', 'unclaimed');

  if (error) {
    console.error('  Cleanup error:', error.message);
    throw error;
  }
  console.log(`  Removed ${count ?? '?'} unclaimed candidates`);
}

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

async function seedReservedHandles(): Promise<void> {
  console.log('Seeding handle reservations...');

  const { data, error } = await supabase
    .from('candidates')
    .select('id, name, normalized_name')
    .not('normalized_name', 'is', null);

  if (error) {
    console.error('  Fetch error:', error.message);
    throw error;
  }

  const reservations = new Map<string, { candidate_id: string; reason: string }>();
  for (const row of data ?? []) {
    const normalized: string = row.normalized_name;
    if (!normalized) continue;

    const tokens = normalized.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) continue;

    const fullHandle = `@${tokens.join('_')}`.toLowerCase();
    if (!reservations.has(fullHandle)) {
      reservations.set(fullHandle, { candidate_id: row.id, reason: 'candidate_auto_full' });
    }

    const lastToken = tokens[tokens.length - 1];
    if (lastToken && lastToken.length >= 3) {
      const lastHandle = `@${lastToken}`.toLowerCase();
      if (!reservations.has(lastHandle)) {
        reservations.set(lastHandle, { candidate_id: row.id, reason: 'candidate_auto_last' });
      }
    }
  }

  if (reservations.size === 0) {
    console.log('  No reservations to insert.');
    return;
  }

  const rows = Array.from(reservations.entries()).map(([handle, meta]) => ({ handle, ...meta }));
  const batchSize = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error: upsertErr } = await supabase
      .from('reserved_handles')
      .upsert(batch, { onConflict: 'handle', ignoreDuplicates: true });
    if (upsertErr) {
      console.error(`  Reservation batch ${i} error:`, upsertErr.message);
      throw upsertErr;
    }
    inserted += batch.length;
  }
  console.log(`  Upserted ${inserted} reservations (${reservations.size} unique handles)`);
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

  // Clean up stale data, then re-seed
  await cleanupBeforeSeed();
  await seedDistricts(districts);
  await seedCandidates(candidates);
  await seedReservedHandles();

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
