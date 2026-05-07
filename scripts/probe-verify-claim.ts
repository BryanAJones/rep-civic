/**
 * Mint a temp authenticated user, invoke verify-candidate-claim
 * directly, and dump the raw HTTP response. Cleans up the temp user
 * afterwards so prod auth stays clean.
 *
 * Usage: npx tsx --env-file=.env scripts/probe-verify-claim.ts
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_KEY!;

const TEST_FILING_ID = 'TEST00001';
const TEST_CANDIDATE_ID = 'ab58f5b9-55c1-4408-914e-fa30ffe84c0a';
const tempEmail = `probe-${Date.now()}@example.test`;
const tempPassword = `Probe-${Date.now()}!Pwd`;

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

console.log(`Creating temp user ${tempEmail}…`);
const { data: created, error: createErr } = await admin.auth.admin.createUser({
  email: tempEmail,
  password: tempPassword,
  email_confirm: true, // skip the email step so we have a session immediately
});
if (createErr || !created.user) {
  console.error('createUser failed:', createErr);
  process.exit(1);
}
const userId = created.user.id;

try {
  // Sign in with password to get a JWT
  const anon = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data: signedIn, error: signInErr } = await anon.auth.signInWithPassword({
    email: tempEmail,
    password: tempPassword,
  });
  if (signInErr || !signedIn.session) {
    console.error('signInWithPassword failed:', signInErr);
    process.exit(1);
  }
  const jwt = signedIn.session.access_token;

  // Invoke the Edge Function with raw fetch so we see the full response
  const fnUrl = `${url}/functions/v1/verify-candidate-claim`;
  console.log(`POST ${fnUrl}`);
  const res = await fetch(fnUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json',
      'apikey': anonKey,
    },
    body: JSON.stringify({
      action: 'initiate',
      candidateId: TEST_CANDIDATE_ID,
      level: 'federal',
      filingId: TEST_FILING_ID,
    }),
  });
  const body = await res.text();
  console.log(`\nstatus: ${res.status} ${res.statusText}`);
  console.log(`body  : ${body}`);
  console.log(`\nresponse headers:`);
  res.headers.forEach((v, k) => console.log(`  ${k}: ${v}`));
} finally {
  console.log(`\nCleaning up temp user ${userId}…`);
  await admin.auth.admin.deleteUser(userId);
  // Also clear any pending_claim that landed
  await admin
    .from('pending_claims')
    .delete()
    .eq('candidate_id', TEST_CANDIDATE_ID);
}
