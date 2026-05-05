import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const MAX_CAPTION_LENGTH = 280
const ANSWER_LIMIT = 30
const ANSWER_WINDOW_SECONDS = 60

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { questionId, candidateId, videoUrl, caption } = await req.json()

    if (!questionId || typeof questionId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'questionId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    if (!candidateId || typeof candidateId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'candidateId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    if (!videoUrl || typeof videoUrl !== 'string') {
      return new Response(
        JSON.stringify({ error: 'videoUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    if (caption && (typeof caption !== 'string' || caption.length > MAX_CAPTION_LENGTH)) {
      return new Response(
        JSON.stringify({ error: `caption must be ${MAX_CAPTION_LENGTH} characters or fewer` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

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
    if (user.is_anonymous) {
      return new Response(
        JSON.stringify({ error: 'Email verification required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Rate limit per authenticated user. Video answers are heavier than
    // questions but candidates working through a busy inbox shouldn't get
    // throttled mid-session — 30/min gives a steady working pace.
    const { data: rateData, error: rateErr } = await supabase.rpc('check_rate_limit', {
      p_user: user.id,
      p_endpoint: 'submit-video-answer',
      p_limit: ANSWER_LIMIT,
      p_window_seconds: ANSWER_WINDOW_SECONDS,
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

    // Verify caller owns a claim for this candidate. Storage RLS already
    // gates the upload itself; this check stops a different claimed user
    // from finalizing someone else's video into the answers table.
    const { data: claim, error: claimErr } = await supabase
      .from('candidate_claims')
      .select('candidate_id')
      .eq('user_id', user.id)
      .eq('candidate_id', candidateId)
      .single()

    if (claimErr || !claim) {
      return new Response(
        JSON.stringify({ error: 'You do not own a claim for this candidate' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Verify question belongs to this candidate
    const { data: question, error: qErr } = await supabase
      .from('questions')
      .select('id, candidate_id, state')
      .eq('id', questionId)
      .single()

    if (qErr || !question) {
      return new Response(
        JSON.stringify({ error: 'Question not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    if (question.candidate_id !== candidateId) {
      return new Response(
        JSON.stringify({ error: 'Question does not belong to this candidate' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Insert the answer video
    const { data: video, error: videoErr } = await supabase
      .from('videos')
      .insert({
        candidate_id: candidateId,
        post_type: 'qa-reply',
        caption: caption?.trim() ?? null,
        video_url: videoUrl,
        answers_question_id: questionId,
      })
      .select()
      .single()

    if (videoErr) throw videoErr

    // Link the question to the answer and flip its state
    const { error: updateErr } = await supabase
      .from('questions')
      .update({
        state: 'answered',
        answer_video_id: video.id,
      })
      .eq('id', questionId)

    if (updateErr) throw updateErr

    return new Response(JSON.stringify(video), {
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
