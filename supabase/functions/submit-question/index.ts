import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { jsonError, jsonResponse, JSON_HEADERS, requireVerifiedUser } from '../_shared/auth.ts'
import { checkRateLimit } from '../_shared/rateLimit.ts'

const MAX_QUESTION_LENGTH = 280
const SUBMIT_LIMIT = 10
const SUBMIT_WINDOW_SECONDS = 60

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { candidateId, videoId, text, topicId } = await req.json()

    if (!candidateId || typeof candidateId !== 'string') {
      return jsonError(400, { error: 'candidateId is required' })
    }
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return jsonError(400, { error: 'text is required' })
    }
    if (text.length > MAX_QUESTION_LENGTH) {
      return jsonError(400, {
        error: `text must be ${MAX_QUESTION_LENGTH} characters or fewer`,
      })
    }

    const auth = await requireVerifiedUser(req)
    if (!auth.ok) return auth.response

    const { user, supabaseAdmin } = auth

    // Submitting is heavier than voting — a burst from one account can flood
    // a candidate's queue and cost the reviewer real attention.
    const rate = await checkRateLimit({
      supabase: supabaseAdmin,
      userId: user.id,
      endpoint: 'submit-question',
      limit: SUBMIT_LIMIT,
      windowSeconds: SUBMIT_WINDOW_SECONDS,
    })
    if (!rate.ok) return rate.response

    const { data: candidate } = await supabaseAdmin
      .from('candidates')
      .select('id')
      .eq('id', candidateId)
      .maybeSingle()

    if (!candidate) {
      return jsonError(404, { error: 'Candidate not found' })
    }

    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('handle')
      .eq('id', user.id)
      .single()

    const authorHandle = profile?.handle ?? '@anonymous'

    const { data, error } = await supabaseAdmin
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
      headers: JSON_HEADERS,
    })
  } catch (err) {
    return jsonResponse(500, {
      error: (err as Error)?.message ?? 'Internal server error',
    })
  }
})
