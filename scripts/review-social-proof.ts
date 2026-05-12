/**
 * Admin CLI for the B6-5 social-proof review queue.
 *
 *   npm run review:social-proof             # list pending submissions
 *   npm run review:social-proof -- --approve <pending_claim_id> [--note "..."]
 *   npm run review:social-proof -- --reject  <pending_claim_id> --reason "..."
 *
 * The two action paths call approve_social_proof / reject_social_proof
 * RPCs (service-role only) which wrap the promote + insert + audit-log
 * transactions. Run with the same .env that the seed scripts use.
 */

import { createClient } from '@supabase/supabase-js';

type PendingRow = {
  id: string;
  candidate_id: string;
  user_id: string;
  filing_id: string;
  level: string;
  social_proof_code: string;
  social_proof_url: string;
  social_proof_submitted_at: string;
  created_at: string;
  expires_at: string;
};

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

const args = process.argv.slice(2);

function getFlag(name: string): string | undefined {
  const i = args.indexOf(name);
  if (i < 0) return undefined;
  return args[i + 1];
}

async function main() {
  const approveId = getFlag('--approve');
  const rejectId = getFlag('--reject');

  if (approveId && rejectId) {
    console.error('Pick one: --approve or --reject (not both).');
    process.exit(1);
  }
  if (approveId) return runApprove(approveId, getFlag('--note') ?? null);
  if (rejectId) {
    const reason = getFlag('--reason');
    if (!reason) {
      console.error('--reject requires --reason "..."');
      process.exit(1);
    }
    return runReject(rejectId, reason);
  }
  return runList();
}

async function runList() {
  const { data, error } = await supabase
    .from('pending_claims')
    .select(
      'id, candidate_id, user_id, filing_id, level, social_proof_code, social_proof_url, social_proof_submitted_at, created_at, expires_at',
    )
    .eq('verification_method', 'social_proof')
    .eq('status', 'pending')
    .not('social_proof_url', 'is', null)
    .order('social_proof_submitted_at', { ascending: true });

  if (error) {
    console.error('Query failed:', error);
    process.exit(1);
  }

  const rows = (data ?? []) as PendingRow[];
  if (!rows.length) {
    console.log('No pending social-proof submissions awaiting review.');
    return;
  }

  // Enrich with candidate names.
  const candidateIds = [...new Set(rows.map((r) => r.candidate_id))];
  const { data: cands } = await supabase
    .from('candidates')
    .select('id, name, office_title')
    .in('id', candidateIds);
  const nameById = new Map(
    (cands ?? []).map((c) => [c.id, `${c.name} (${c.office_title})`]),
  );

  console.log(`${rows.length} pending social-proof submission(s):\n`);
  for (const r of rows) {
    console.log(`  pending_claim_id : ${r.id}`);
    console.log(`  candidate        : ${nameById.get(r.candidate_id) ?? r.candidate_id}`);
    console.log(`  filing_id        : ${r.filing_id}  (${r.level})`);
    console.log(`  claimant user_id : ${r.user_id}`);
    console.log(`  expected code    : ${r.social_proof_code}`);
    console.log(`  proof URL        : ${r.social_proof_url}`);
    console.log(`  submitted        : ${r.social_proof_submitted_at}`);
    console.log(`  expires          : ${r.expires_at}`);
    console.log('');
  }
  console.log('Review the URL manually. The post should contain the expected code,');
  console.log('be on a publicly-identifiable campaign account, and align with the');
  console.log('candidate identity from the filing.\n');
  console.log('Approve: npm run review:social-proof -- --approve <id> [--note "..."]');
  console.log('Reject : npm run review:social-proof -- --reject <id> --reason "..."');
}

async function runApprove(pendingClaimId: string, note: string | null) {
  const { data, error } = await supabase.rpc('approve_social_proof', {
    p_pending_claim_id: pendingClaimId,
    p_admin_note: note,
  });
  if (error) {
    console.error('Approval failed:', error.message ?? error);
    process.exit(1);
  }
  const row = Array.isArray(data) ? data[0] : data;
  console.log('Approved.');
  if (row) {
    console.log(`  candidate_name : ${row.candidate_name}`);
    console.log(`  candidate_id   : ${row.candidate_id}`);
    console.log(`  user_id        : ${row.user_id}`);
  }
  console.log('\nThe candidate can now sign in and access the dashboard.');
}

async function runReject(pendingClaimId: string, reason: string) {
  const { error } = await supabase.rpc('reject_social_proof', {
    p_pending_claim_id: pendingClaimId,
    p_reason: reason,
  });
  if (error) {
    console.error('Rejection failed:', error.message ?? error);
    process.exit(1);
  }
  console.log(`Rejected. Reason recorded in audit_log: "${reason}"`);
}

main().catch((err) => {
  console.error('review-social-proof failed:', err);
  process.exit(1);
});
