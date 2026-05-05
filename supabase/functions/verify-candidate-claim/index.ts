// verify-candidate-claim
//
// Two-action dispatcher for the self-onboarding claim flow:
//
//   action='initiate'  Caller is the person who clicked "Is this you?
//                       Claim this profile." We resolve the verification
//                       path (FEC API → committee email, or social-proof
//                       fallback when no email is on file), insert a
//                       pending_claims row, and either send a magic link
//                       or return a generated proof code.
//
//   action='finalize'  Caller has just clicked the magic link in the
//                       committee inbox and is now authenticated AS that
//                       email. We look up the pending claim by their
//                       verified email, promote it, insert the
//                       candidate_claims row, and flip
//                       candidates.status='claimed'.
//
// Phase 1 ships only the federal path (FEC API). State and local return
// 501 — phase 4 wires state via the registry, phase 6 designs local.
//
// Retires `claim-candidate` (which was a verification bypass).

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { jsonError, jsonResponse, requireVerifiedUser } from '../_shared/auth.ts'
import { checkRateLimit } from '../_shared/rateLimit.ts'
import { lookupFederalCandidate } from '../_shared/fec.ts'

const RATE_LIMIT = 10
const RATE_WINDOW_SECONDS = 3600 // 1 hour

type InitiateBody = {
  action: 'initiate'
  candidateId: string
  level: 'federal' | 'state' | 'local'
  filingId: string
}

type FinalizeBody = {
  action: 'finalize'
}

type RequestBody = InitiateBody | FinalizeBody

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = (await req.json()) as RequestBody

    const auth = await requireVerifiedUser(req)
    if (!auth.ok) return auth.response

    if (body.action === 'initiate') {
      return await initiate(body, auth.user.id, auth.supabaseAdmin)
    }
    if (body.action === 'finalize') {
      return await finalize(auth.user.id, auth.user.email ?? null, auth.supabaseAdmin)
    }
    return jsonError(400, { error: 'Unknown action' })
  } catch (err) {
    return jsonError(500, { error: (err as Error)?.message ?? 'Internal server error' })
  }
})

async function initiate(
  body: InitiateBody,
  userId: string,
  supabase: ReturnType<typeof createClient>,
): Promise<Response> {
  if (!body.candidateId || !body.filingId || !body.level) {
    return jsonError(400, { error: 'candidateId, filingId, and level are required' })
  }
  if (body.level !== 'federal') {
    return jsonError(501, {
      error: 'Only federal verification is implemented in phase 1',
      code: 'LEVEL_NOT_IMPLEMENTED',
    })
  }

  // Rate limit before any external work
  const rate = await checkRateLimit({
    supabase,
    userId,
    endpoint: 'verify-candidate-claim',
    limit: RATE_LIMIT,
    windowSeconds: RATE_WINDOW_SECONDS,
  })
  if (!rate.ok) return rate.response

  // Verify the candidate exists, is unclaimed, and the filing_id matches
  const { data: candidate } = await supabase
    .from('candidates')
    .select('id, name, status, filing_id')
    .eq('id', body.candidateId)
    .maybeSingle()

  if (!candidate) return jsonError(404, { error: 'Candidate not found' })
  if (candidate.status !== 'unclaimed') {
    return jsonError(409, { error: 'This profile has already been claimed' })
  }
  if (candidate.filing_id !== body.filingId) {
    return jsonError(404, {
      error: "That filing ID doesn't match this candidate",
      code: 'FILING_ID_MISMATCH',
    })
  }

  // One claim per user (across the whole table)
  const { data: existingUserClaim } = await supabase
    .from('candidate_claims')
    .select('candidate_id')
    .eq('user_id', userId)
    .maybeSingle()
  if (existingUserClaim) {
    return jsonError(409, { error: 'You have already claimed a candidate profile' })
  }

  // Federal lookup (cache-first, FEC fallback)
  const lookup = await lookupFederalCandidate(supabase, body.filingId)
  if (!lookup.ok) {
    if (lookup.reason === 'not_found') {
      return jsonError(404, { error: 'Filing ID not found in FEC records' })
    }
    return jsonError(502, { error: 'Could not reach FEC. Try again in a moment.' })
  }

  if (lookup.emailOnFile) {
    const result = await createPendingAndSendMagicLink({
      supabase,
      candidateId: body.candidateId,
      userId,
      filingId: body.filingId,
      contactEmail: lookup.emailOnFile,
      level: body.level,
    })
    return result
  }

  // No email on file → social-proof branch (phase 5 fills the UI)
  const code = generateProofCode()
  const insertSocial = await supabase.from('pending_claims').insert({
    candidate_id: body.candidateId,
    user_id: userId,
    filing_id: body.filingId,
    level: body.level,
    verification_method: 'social_proof',
    social_proof_code: code,
  })
  if (insertSocial.error) {
    if (insertSocial.error.code === '23505') {
      return jsonError(409, {
        error: 'A claim is already pending for this profile. Try again in 30 minutes.',
        code: 'PENDING_CLAIM_EXISTS',
      })
    }
    throw insertSocial.error
  }

  return jsonResponse(200, {
    status: 'social_proof_required',
    code,
    instructions:
      'Post this exact code from a campaign social account or campaign-domain page. Phase 5 wires up the verification check.',
  })
}

type CreatePendingArgs = {
  supabase: ReturnType<typeof createClient>
  candidateId: string
  userId: string
  filingId: string
  contactEmail: string
  level: 'federal' | 'state' | 'local'
}

async function createPendingAndSendMagicLink(args: CreatePendingArgs): Promise<Response> {
  const { supabase, candidateId, userId, filingId, contactEmail, level } = args

  const insertEmail = await supabase.from('pending_claims').insert({
    candidate_id: candidateId,
    user_id: userId,
    filing_id: filingId,
    level,
    verification_method: 'fec_email',
    contact_email: contactEmail.toLowerCase(),
  })
  if (insertEmail.error) {
    if (insertEmail.error.code === '23505') {
      return jsonError(409, {
        error: 'A claim is already pending for this profile. Try again in 30 minutes.',
        code: 'PENDING_CLAIM_EXISTS',
      })
    }
    throw insertEmail.error
  }

  // Send the magic link to the FEC-on-file email. We use the anon client
  // (no auth header) so signInWithOtp is treated as a fresh-session sign-in.
  const anonClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  )
  const redirectBase = Deno.env.get('PUBLIC_APP_URL') ?? 'https://getrep.org'
  const { error: otpErr } = await anonClient.auth.signInWithOtp({
    email: contactEmail,
    options: {
      emailRedirectTo: `${redirectBase}/app/claim/finalize`,
      shouldCreateUser: true,
    },
  })
  if (otpErr) {
    // Don't leak the candidate's email back to the caller.
    return jsonError(502, { error: 'Could not send verification email. Try again in a moment.' })
  }

  return jsonResponse(200, {
    status: 'email_sent',
    emailHint: maskEmail(contactEmail),
  })
}

async function finalize(
  userId: string,
  userEmail: string | null,
  supabase: ReturnType<typeof createClient>,
): Promise<Response> {
  if (!userEmail) {
    return jsonError(400, { error: 'Session has no email — magic-link flow incomplete' })
  }

  const { data: pending } = await supabase
    .from('pending_claims')
    .select('id, candidate_id, verification_method, expires_at, status')
    .eq('contact_email', userEmail.toLowerCase())
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!pending) {
    return jsonError(404, {
      error: 'No pending claim found for this email',
      code: 'NO_PENDING_CLAIM',
    })
  }

  // Promote: pending → verified (audit trigger fires on UPDATE)
  const { error: promoteErr } = await supabase
    .from('pending_claims')
    .update({ status: 'verified', verified_at: new Date().toISOString() })
    .eq('id', pending.id)
    .eq('status', 'pending')
  if (promoteErr) throw promoteErr

  // Insert claim. Trigger writes 'candidate.claimed' to audit_log.
  const insertClaim = await supabase.from('candidate_claims').insert({
    candidate_id: pending.candidate_id,
    user_id: userId,
    verification_method: pending.verification_method,
    verified_at: new Date().toISOString(),
  })
  if (insertClaim.error) {
    if (insertClaim.error.code === '23505') {
      return jsonError(409, { error: 'This profile has already been claimed' })
    }
    throw insertClaim.error
  }

  // Flip status. Guard on 'unclaimed' so we never overwrite an active.
  const { error: statusErr } = await supabase
    .from('candidates')
    .update({ status: 'claimed' })
    .eq('id', pending.candidate_id)
    .eq('status', 'unclaimed')
  if (statusErr) throw statusErr

  const { data: candidate } = await supabase
    .from('candidates')
    .select('id, name')
    .eq('id', pending.candidate_id)
    .single()

  return jsonResponse(200, {
    status: 'claimed',
    candidateId: candidate?.id,
    candidateName: candidate?.name,
  })
}

function generateProofCode(): string {
  // 9-char alphanumeric, easy to read aloud or copy. Excludes ambiguous chars.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = new Uint8Array(9)
  crypto.getRandomValues(bytes)
  let out = ''
  for (let i = 0; i < bytes.length; i++) {
    out += alphabet[bytes[i] % alphabet.length]
    if (i === 2 || i === 5) out += '-'
  }
  return out
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return '***'
  const head = local.slice(0, 3)
  return `${head}${'*'.repeat(Math.max(1, local.length - 3))}@${domain}`
}
