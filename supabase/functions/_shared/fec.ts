// FEC API client for federal candidate verification.
//
// Two-tier lookup:
//   1. candidate_registry cache (source='fec', last_verified_at within 24h)
//   2. live api.open.fec.gov call, then cache the result
//
// Returns the principal-committee email when present. The audit's primary
// finding (43% coverage) lives behind this exact field — many candidates
// will return null, which is the expected branch into the social-proof
// fallback.

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'

const FEC_API_BASE = 'https://api.open.fec.gov/v1'
const CACHE_TTL_HOURS = 24

export type FederalLookup =
  | { ok: true; emailOnFile: string | null; name: string; party: string | null }
  | { ok: false; reason: 'not_found' | 'fec_error'; status?: number }

type RegistryRow = {
  email_on_file: string | null
  name: string
  party: string | null
  last_verified_at: string
}

export async function lookupFederalCandidate(
  supabase: SupabaseClient,
  filingId: string,
): Promise<FederalLookup> {
  const { data: cached } = await supabase
    .from('candidate_registry')
    .select('email_on_file, name, party, last_verified_at')
    .eq('source', 'fec')
    .eq('filing_id', filingId)
    .maybeSingle<RegistryRow>()

  if (cached && isFresh(cached.last_verified_at)) {
    return {
      ok: true,
      emailOnFile: cached.email_on_file,
      name: cached.name,
      party: cached.party,
    }
  }

  const live = await callFecApi(filingId)
  if (!live.ok) return live

  await supabase.from('candidate_registry').upsert(
    {
      source: 'fec',
      filing_id: filingId,
      level: 'federal',
      name: live.name,
      party: live.party,
      email_on_file: live.emailOnFile,
      last_verified_at: new Date().toISOString(),
    },
    { onConflict: 'source,filing_id' },
  )

  return live
}

function isFresh(lastVerifiedAt: string): boolean {
  const ageMs = Date.now() - new Date(lastVerifiedAt).getTime()
  return ageMs < CACHE_TTL_HOURS * 60 * 60 * 1000
}

async function callFecApi(filingId: string): Promise<FederalLookup> {
  const apiKey = Deno.env.get('FEC_API_KEY')
  if (!apiKey) {
    return { ok: false, reason: 'fec_error' }
  }

  // Candidate detail (name, party)
  const detailUrl = `${FEC_API_BASE}/candidate/${encodeURIComponent(filingId)}/?api_key=${apiKey}`
  const detailRes = await fetch(detailUrl)
  if (detailRes.status === 404) return { ok: false, reason: 'not_found' }
  if (!detailRes.ok) {
    return { ok: false, reason: 'fec_error', status: detailRes.status }
  }
  const detailJson = await detailRes.json()
  const detail = detailJson?.results?.[0]
  if (!detail) return { ok: false, reason: 'not_found' }

  // Principal committee → email
  const cmteUrl = `${FEC_API_BASE}/candidate/${encodeURIComponent(filingId)}/committees/?designation=P&api_key=${apiKey}`
  const cmteRes = await fetch(cmteUrl)
  let email: string | null = null
  if (cmteRes.ok) {
    const cmteJson = await cmteRes.json()
    const principal = cmteJson?.results?.[0]
    email = (typeof principal?.email === 'string' && principal.email.trim()) || null
  }

  return {
    ok: true,
    emailOnFile: email,
    name: detail.name ?? '',
    party: detail.party ?? null,
  }
}
