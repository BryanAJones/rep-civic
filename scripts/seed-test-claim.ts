/**
 * Seed a fake unclaimed candidate + cached registry entry so the
 * verify-candidate-claim flow can be dogfooded end-to-end without
 * needing access to a real candidate's committee inbox.
 *
 * Default behavior: insert (or refresh) a test candidate with filing_id
 * `TEST00001` and a candidate_registry row whose `email_on_file` points
 * at the address you control. The verify function will use the cached
 * registry value instead of calling FEC, send a magic link to your
 * inbox, and once you click it the finalize step writes the claim.
 *
 * Usage:
 *   npm run seed:test-claim -- --email you@example.com
 *   npm run seed:test-claim -- --cleanup
 *
 * Requires SUPABASE_SERVICE_KEY in .env.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

const TEST_FILING_ID = 'TEST00001';
const TEST_NAME = 'Test Candidate (verify-flow seed)';

const args = process.argv.slice(2);
const cleanup = args.includes('--cleanup');
const emailArg = args.indexOf('--email');
const email = emailArg >= 0 ? args[emailArg + 1] : process.env.SEED_EMAIL;

async function main() {
  if (cleanup) return runCleanup();
  if (!email) {
    console.error('Usage: npm run seed:test-claim -- --email you@example.com');
    console.error('       npm run seed:test-claim -- --cleanup');
    process.exit(1);
  }
  await runSeed(email);
}

async function runSeed(targetEmail: string) {
  // Pick any existing district code so the FK validates. Federal CD-5 is
  // standard in the GA seed.
  const { data: anyDistrict, error: distErr } = await supabase
    .from('districts')
    .select('code')
    .eq('level', 'federal')
    .limit(1)
    .single();
  if (distErr || !anyDistrict) {
    console.error('Could not find a federal district to attach the test candidate to.');
    console.error(distErr);
    process.exit(1);
  }

  // Upsert the candidate. We key on filing_id (UNIQUE per the
  // 20260406000000 migration), so re-running this script is idempotent.
  const { data: candidate, error: candErr } = await supabase
    .from('candidates')
    .upsert(
      {
        name: TEST_NAME,
        initials: 'TC',
        office_title: 'GA US House (test)',
        district_code: anyDistrict.code,
        party: 'Independent',
        status: 'unclaimed',
        filing_id: TEST_FILING_ID,
      },
      { onConflict: 'filing_id' },
    )
    .select('id, name, status, district_code')
    .single();
  if (candErr || !candidate) {
    console.error('Candidate upsert failed:', candErr);
    process.exit(1);
  }

  // If a previous test already claimed this candidate, undo so the next
  // claim can succeed. Idempotent re-runs need this branch.
  if (candidate.status !== 'unclaimed') {
    await supabase.rpc('revoke_candidate_claim', {
      p_candidate_id: candidate.id,
      p_reason: 'seed-test-claim re-run',
    });
  }

  // Seed the registry cache with the user's email so verify-federal
  // skips the FEC API call.
  const { error: regErr } = await supabase.from('candidate_registry').upsert(
    {
      source: 'fec',
      filing_id: TEST_FILING_ID,
      level: 'federal',
      name: TEST_NAME,
      email_on_file: targetEmail.toLowerCase(),
      last_verified_at: new Date().toISOString(),
    },
    { onConflict: 'source,filing_id' },
  );
  if (regErr) {
    console.error('Registry upsert failed:', regErr);
    process.exit(1);
  }

  // Clear any stale pending_claims on this candidate so a re-test starts
  // from a clean slate (the UNIQUE partial index would otherwise reject
  // a fresh attempt for 30 minutes).
  await supabase
    .from('pending_claims')
    .delete()
    .eq('candidate_id', candidate.id)
    .eq('status', 'pending');

  console.log('Seed ready.');
  console.log(`  candidate_id  : ${candidate.id}`);
  console.log(`  filing_id     : ${TEST_FILING_ID}`);
  console.log(`  email_on_file : ${targetEmail}`);
  console.log(`  district      : ${candidate.district_code}`);
  console.log('');
  console.log('Test flow:');
  console.log(`  1. Open https://getrep.org/app/profile/${candidate.id}`);
  console.log('  2. Click "Is this you? Claim this profile"');
  console.log(`  3. Enter filing ID: ${TEST_FILING_ID}`);
  console.log(`  4. Watch ${targetEmail} for the magic link`);
  console.log('  5. Click the link — lands at /app/claim/finalize, routes to /app/dashboard');
  console.log('');
  console.log('When done: npm run seed:test-claim -- --cleanup');
}

async function runCleanup() {
  const { data: cand } = await supabase
    .from('candidates')
    .select('id')
    .eq('filing_id', TEST_FILING_ID)
    .maybeSingle();

  if (cand) {
    // If the candidate was claimed during testing, revoke first so the
    // claims/audit trail is cleaned. Then delete the candidate (cascades
    // to pending_claims via FK).
    const { data: claim } = await supabase
      .from('candidate_claims')
      .select('candidate_id')
      .eq('candidate_id', cand.id)
      .maybeSingle();
    if (claim) {
      await supabase.rpc('revoke_candidate_claim', {
        p_candidate_id: cand.id,
        p_reason: 'seed-test-claim cleanup',
      });
    }
    await supabase.from('candidates').delete().eq('id', cand.id);
    console.log(`Deleted test candidate ${cand.id}`);
  } else {
    console.log('No test candidate found.');
  }

  await supabase.from('candidate_registry').delete().eq('filing_id', TEST_FILING_ID);
  console.log('Cleared candidate_registry entry.');
}

main().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
