import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const MAX_QUESTION_LENGTH = 280
const SUBMIT_LIMIT = 10
const SUBMIT_WINDOW_SECONDS = 60

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { candidateId, videoId, text, topicId } = await req.json()

    // Validate required fields
    if (!candidateId || typeof candidateId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'candidateId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (text.length > MAX_QUESTION_LENGTH) {
      return new Response(
        JSON.stringify({ error: `text must be ${MAX_QUESTION_LENGTH} characters or fewer` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Authenticate the caller
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

    // Gate: anonymous sessions can browse/read but cannot submit. This is the
    // durable-identity floor — if we accepted anonymous writes the question
    // would be tied to a handle string only, with no way to recover ownership
    // when the device session ends.
    if (user.is_anonymous) {
      return new Response(
        JSON.stringify({ error: 'Verify your email to ask a question.', code: 'EMAIL_REQUIRED' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Use service_role to bypass RLS for writes
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Rate limit per authenticated user. Submitting is heavier than voting —
    // a burst from one account can flood a candidate's queue and cost the
    // reviewer real attention, so the limit is tighter than vote-question's.
    const { data: rateData, error: rateErr } = await supabase.rpc('check_rate_limit', {
      p_user: user.id,
      p_endpoint: 'submit-question',
      p_limit: SUBMIT_LIMIT,
      p_window_seconds: SUBMIT_WINDOW_SECONDS,
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

    // Verify candidate exists
    const { data: candidate, error: candErr } = await supabase
      .from('candidates')
      .select('id')
      .eq('id', candidateId)
      .single()

    if (candErr || !candidate) {
      return new Response(
        JSON.stringify({ error: 'Candidate not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Derive handle from user_profiles
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('handle')
      .eq('id', user.id)
      .single()

    const authorHandle = profile?.handle ?? '@anonymous'

    const { data, error } = await supabase
      .from('questions')
      .insert({
        candidate_id: candidateId,
        video_id: videoId ?? null,
        text: text.trim(),
        topic_id: topicId ?? null,
        author_handle: authorHandle,
        asked_by: user.id,
        plus_one_count: 1,
        state: 'default',
      })
      .select()
      .single()

    if (error) throw error

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message ?? 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
