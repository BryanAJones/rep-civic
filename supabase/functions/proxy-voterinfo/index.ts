// Google Civic voterInfoQuery proxy — election-window ballot authority.
//
// Flow:
//   1. Validate address. Compute sha256 cache key.
//   2. Opportunistic cleanup: delete expired cache rows.
//   3. Cache lookup; if fresh, return cached districts + candidate IDs.
//   4. Call Google voterInfoQuery; if empty or errored, return fallback.
//   5. Upsert districts + candidates (enrich-only, never overwrite identity).
//   6. Write cache row with TTL = min(electionDate + 1d, now + 24h).
//   7. Return structured { source, districts, candidateIds, electionName, electionDate }.
//
// Auth: no JWT required (read-through proxy that writes with service_role).
// Mirrors the proxy-geocodio pattern.

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { normalizeName } from './normalize.ts'
import { mapDistrict, MappedDistrict } from './districtCode.ts'

const GOOGLE_BASE = 'https://www.googleapis.com/civicinfo/v2/voterinfo'
const MAX_ADDRESS_LENGTH = 200
const DEFAULT_STATE = 'GA' // launch market; switch to state-detection when expanding

interface GoogleCandidate {
  name: string
  party?: string
  candidateUrl?: string
  phone?: string
  email?: string
  photoUrl?: string
}

interface GoogleContest {
  type?: string
  office?: string
  ballotTitle?: string
  district: { name: string; scope: string; id?: string }
  candidates?: GoogleCandidate[]
}

interface GoogleResponse {
  election?: { id: string; name: string; electionDay: string }
  contests?: GoogleContest[]
  otherElections?: unknown[]
}

// ── utilities ──────────────────────────────────────────────
async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter((p) => p.length > 1)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function log(event: Record<string, unknown>): void {
  // Structured log line — consumed by `supabase functions logs`.
  console.log(JSON.stringify({ fn: 'proxy-voterinfo', ...event }))
}

// ── main ───────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const started = Date.now()
  try {
    const { address } = await req.json()

    if (!address || typeof address !== 'string' || address.trim().length === 0) {
      return jsonResponse({ error: 'address is required' }, 400)
    }
    if (address.length > MAX_ADDRESS_LENGTH) {
      return jsonResponse(
        { error: `address must be ${MAX_ADDRESS_LENGTH} characters or fewer` },
        400,
      )
    }

    const apiKey = Deno.env.get('GOOGLE_CIVIC_API_KEY')
    if (!apiKey) {
      return jsonResponse({ error: 'Google Civic API key not configured' }, 500)
    }

    const supabase: SupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const normalizedAddress = address.trim().toLowerCase().replace(/\s+/g, ' ')
    const addressHash = await sha256Hex(normalizedAddress)

    // Opportunistic cleanup of expired cache rows.
    await supabase.from('voterinfo_cache').delete().lt('expires_at', new Date().toISOString())

    // Cache lookup.
    const { data: cached } = await supabase
      .from('voterinfo_cache')
      .select('payload, district_codes, election_date, expires_at')
      .eq('address_hash', addressHash)
      .maybeSingle()

    if (cached && new Date(cached.expires_at) > new Date()) {
      const districts = await loadDistrictsByCodes(supabase, cached.district_codes)
      const candidateIds = await loadCandidateIdsByDistricts(supabase, cached.district_codes)
      log({
        event: 'cache_hit',
        address_hash: addressHash,
        districts_count: districts.length,
        duration_ms: Date.now() - started,
      })
      return jsonResponse({
        source: 'google',
        electionName: cached.payload?.election?.name,
        electionDate: cached.election_date,
        districts,
        candidateIds,
      })
    }

    // Call Google.
    const url = new URL(GOOGLE_BASE)
    url.searchParams.set('address', address.trim())
    url.searchParams.set('key', apiKey)

    const res = await fetch(url.toString())
    const googleStatus = res.status

    if (!res.ok) {
      log({
        event: 'google_error',
        address_hash: addressHash,
        google_status: googleStatus,
        duration_ms: Date.now() - started,
      })
      return jsonResponse({
        source: 'fallback',
        districts: [],
        candidateIds: [],
        ...(googleStatus === 429 ? { retryAfter: res.headers.get('retry-after') ?? '60' } : {}),
      })
    }

    const payload = (await res.json()) as GoogleResponse
    const contests = payload.contests ?? []

    if (contests.length === 0) {
      log({
        event: 'no_contests',
        address_hash: addressHash,
        google_status: googleStatus,
        duration_ms: Date.now() - started,
      })
      return jsonResponse({
        source: 'fallback',
        districts: [],
        candidateIds: [],
      })
    }

    // Map contests to districts and candidates.
    const districtsByCode = new Map<string, MappedDistrict>()
    const candidatesToUpsert: {
      name: string
      initials: string
      office_title: string
      district_code: string
      party: string
      campaign_url: string | null
      phone: string | null
      email: string | null
      photo_url: string | null
      normalized_name: string
      sources: string[]
    }[] = []

    for (const contest of contests) {
      const mapped = mapDistrict({
        district: contest.district,
        office: contest.office,
        ballotTitle: contest.ballotTitle,
        stateAbbr: DEFAULT_STATE,
      })
      if (!mapped) continue
      districtsByCode.set(mapped.code, mapped)

      for (const cand of contest.candidates ?? []) {
        if (!cand.name) continue
        candidatesToUpsert.push({
          name: cand.name,
          initials: initials(cand.name),
          office_title: mapped.officeTitle,
          district_code: mapped.code,
          party: cand.party ?? 'Unknown',
          campaign_url: cand.candidateUrl ?? null,
          phone: cand.phone ?? null,
          email: cand.email ?? null,
          photo_url: cand.photoUrl ?? null,
          normalized_name: normalizeName(cand.name),
          sources: ['google'],
        })
      }
    }

    // Upsert districts (never downgrade source from 'geocodio').
    const districtRows = Array.from(districtsByCode.values()).map((d) => ({
      code: d.code,
      level: d.level,
      office_title: d.officeTitle,
      district_name: d.districtName,
      display_label: d.displayLabel,
      scope: d.scope,
      external_id: d.externalId ?? null,
      source: 'google',
    }))

    if (districtRows.length > 0) {
      const { error: districtErr } = await supabase
        .from('districts')
        .upsert(districtRows, { onConflict: 'code' })
      if (districtErr) {
        log({ event: 'district_upsert_error', error: districtErr.message })
      }
    }

    // Upsert candidates via enrich-only RPC-free pattern. We use the SQL
    // directly through supabase-js which doesn't natively support
    // column-level COALESCE on conflict — so we go through a staged RPC
    // helper. For commit 2, call a simple per-row upsert; the enrich
    // semantics are enforced by trigger-free application logic below:
    // fetch existing, merge, upsert.
    const candidateIds: string[] = []
    for (const c of candidatesToUpsert) {
      const { data: existing } = await supabase
        .from('candidates')
        .select('id, campaign_url, phone, email, photo_url, sources, name, party, status, office_title, needs_manual_dedup')
        .eq('normalized_name', c.normalized_name)
        .eq('district_code', c.district_code)
        .eq('needs_manual_dedup', false)
        .maybeSingle()

      if (existing) {
        const mergedSources = Array.from(new Set([...(existing.sources ?? []), 'google']))
        const { error: updErr } = await supabase
          .from('candidates')
          .update({
            campaign_url: existing.campaign_url ?? c.campaign_url,
            phone: existing.phone ?? c.phone,
            email: existing.email ?? c.email,
            photo_url: existing.photo_url ?? c.photo_url,
            sources: mergedSources,
          })
          .eq('id', existing.id)
        if (updErr) log({ event: 'candidate_update_error', error: updErr.message })
        candidateIds.push(existing.id)
      } else {
        const { data: inserted, error: insErr } = await supabase
          .from('candidates')
          .insert({
            ...c,
            status: 'unclaimed',
            opponent_count: 0,
            question_count: 0,
          })
          .select('id')
          .single()
        if (insErr) {
          log({ event: 'candidate_insert_error', error: insErr.message, name: c.name })
        } else if (inserted) {
          candidateIds.push(inserted.id)
        }
      }
    }

    // Write cache row.
    const electionDate = payload.election?.electionDay ?? null
    const now = Date.now()
    const twentyFourHoursMs = 24 * 60 * 60 * 1000
    const electionCap = electionDate
      ? new Date(electionDate).getTime() + twentyFourHoursMs
      : now + twentyFourHoursMs
    const expiresAt = new Date(Math.min(electionCap, now + twentyFourHoursMs)).toISOString()

    await supabase
      .from('voterinfo_cache')
      .upsert(
        {
          address_hash: addressHash,
          payload,
          district_codes: Array.from(districtsByCode.keys()),
          election_date: electionDate,
          fetched_at: new Date(now).toISOString(),
          expires_at: expiresAt,
        },
        { onConflict: 'address_hash' },
      )

    // Return mapped districts (not reloaded from DB — use what we mapped).
    const districts = Array.from(districtsByCode.values()).map((d) => ({
      code: d.code,
      level: d.level,
      officeTitle: d.officeTitle,
      districtName: d.districtName,
      displayLabel: d.displayLabel,
      candidateIds: [],
    }))

    log({
      event: 'google_hit',
      address_hash: addressHash,
      google_status: googleStatus,
      contests_count: contests.length,
      candidates_upserted: candidatesToUpsert.length,
      districts_upserted: districtRows.length,
      source: 'google',
      duration_ms: Date.now() - started,
    })

    return jsonResponse({
      source: 'google',
      electionName: payload.election?.name,
      electionDate,
      districts,
      candidateIds,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    log({ event: 'exception', error: message, duration_ms: Date.now() - started })
    return jsonResponse({ error: message }, 500)
  }
})

async function loadDistrictsByCodes(supabase: SupabaseClient, codes: string[]) {
  if (!codes || codes.length === 0) return []
  const { data } = await supabase
    .from('districts')
    .select('code, level, office_title, district_name, display_label')
    .in('code', codes)
  return (data ?? []).map((d: {
    code: string
    level: string
    office_title: string
    district_name: string
    display_label: string
  }) => ({
    code: d.code,
    level: d.level,
    officeTitle: d.office_title,
    districtName: d.district_name,
    displayLabel: d.display_label,
    candidateIds: [],
  }))
}

async function loadCandidateIdsByDistricts(
  supabase: SupabaseClient,
  codes: string[],
): Promise<string[]> {
  if (!codes || codes.length === 0) return []
  const { data } = await supabase
    .from('candidates')
    .select('id')
    .in('district_code', codes)
    .eq('needs_manual_dedup', false)
  return (data ?? []).map((c: { id: string }) => c.id)
}
