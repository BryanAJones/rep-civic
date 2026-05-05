import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const VOTE_LIMIT = 30
const VOTE_WINDOW_SECONDS = 60

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { questionId } = await req.json()

    if (!questionId || typeof questionId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'questionId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Create client with caller's auth context to get their user ID
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

    // Get the authenticated user's ID
    const { data: { user }, error: userErr } = await anonClient.auth.getUser()
    if (userErr || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Gate: anonymous users can read vote counts but cannot cast a +1. Same
    // reason as submit-question — tie votes to a recoverable identity.
    if (user.is_anonymous) {
      return new Response(
        JSON.stringify({ error: 'Verify your email to +1 a question.', code: 'EMAIL_REQUIRED' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Use service_role for the write operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Step 0: Rate limit check
    const { data: rateData, error: rateErr } = await supabase.rpc('check_rate_limit', {
      p_user: user.id,
      p_endpoint: 'vote-question',
      p_limit: VOTE_LIMIT,
      p_window_seconds: VOTE_WINDOW_SECONDS,
    })
    if (rateErr) throw rateErr
    const verdict = Array.isArray(rateData) ? rateData[0] : rateData
    if (verdict && verdict.allowed === false) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfterSeconds: verdict.retry_after_seconds,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': String(verdict.retry_after_seconds ?? 1),
          },
        },
      )
    }

    // Step 1: Insert vote record (ON CONFLICT = already voted)
    const { error: voteErr } = await supabase
      .from('question_votes')
      .insert({ user_id: user.id, question_id: questionId })

    if (voteErr) {
      // 23505 = unique_violation (already voted)
      if (voteErr.code === '23505') {
        return new Response(
          JSON.stringify({ error: 'Already voted on this question' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
      throw voteErr
    }

    // Step 2: Atomic increment via RPC
    const { data: newCount, error: rpcErr } = await supabase
      .rpc('increment_plus_one', { qid: questionId })

    if (rpcErr) throw rpcErr

    return new Response(
      JSON.stringify({ newCount }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message ?? 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
