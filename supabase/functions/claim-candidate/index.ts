import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { candidateId } = await req.json()

    if (!candidateId || typeof candidateId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'candidateId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Verify caller is authenticated (non-anonymous)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user }, error: userErr } = await anonClient.auth.getUser()
    if (userErr || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Must be non-anonymous (email verified via magic link)
    if (user.is_anonymous) {
      return new Response(
        JSON.stringify({ error: 'Email verification required before claiming a profile. Upgrade your account first.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Verify candidate exists and is unclaimed
    const { data: candidate, error: candErr } = await supabase
      .from('candidates')
      .select('id, status, name')
      .eq('id', candidateId)
      .single()

    if (candErr || !candidate) {
      return new Response(
        JSON.stringify({ error: 'Candidate not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (candidate.status !== 'unclaimed') {
      return new Response(
        JSON.stringify({ error: 'This profile has already been claimed' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Check user hasn't already claimed a different candidate
    const { data: existingClaim } = await supabase
      .from('candidate_claims')
      .select('candidate_id')
      .eq('user_id', user.id)
      .single()

    if (existingClaim) {
      return new Response(
        JSON.stringify({ error: 'You have already claimed a candidate profile' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Write-once claim insert
    const { error: claimErr } = await supabase
      .from('candidate_claims')
      .insert({
        candidate_id: candidateId,
        user_id: user.id,
        verification_method: 'self_attestation',
      })

    if (claimErr) {
      // 23505 = unique_violation (candidate already claimed by another user)
      if (claimErr.code === '23505') {
        return new Response(
          JSON.stringify({ error: 'This profile has already been claimed' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
      throw claimErr
    }

    // Transition candidate status: unclaimed → claimed
    const { error: updateErr } = await supabase
      .from('candidates')
      .update({ status: 'claimed' })
      .eq('id', candidateId)
      .eq('status', 'unclaimed') // Guard: only transition from unclaimed

    if (updateErr) throw updateErr

    return new Response(
      JSON.stringify({
        candidateId,
        candidateName: candidate.name,
        status: 'claimed',
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message ?? 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
