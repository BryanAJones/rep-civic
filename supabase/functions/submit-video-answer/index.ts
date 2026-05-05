import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { jsonError, jsonResponse, JSON_HEADERS, requireVerifiedUser } from '../_shared/auth.ts'
import { checkRateLimit } from '../_shared/rateLimit.ts'

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
      return jsonError(400, { error: 'questionId is required' })
    }
    if (!candidateId || typeof candidateId !== 'string') {
      return jsonError(400, { error: 'candidateId is required' })
    }
    if (!videoUrl || typeof videoUrl !== 'string') {
      return jsonError(400, { error: 'videoUrl is required' })
    }
    if (caption && (typeof caption !== 'string' || caption.length > MAX_CAPTION_LENGTH)) {
      return jsonError(400, {
        error: `caption must be ${MAX_CAPTION_LENGTH} characters or fewer`,
      })
    }

    const auth = await requireVerifiedUser(req)
    if (!auth.ok) return auth.response

    const { user, supabaseAdmin } = auth

    const rate = await checkRateLimit({
      supabase: supabaseAdmin,
      userId: user.id,
      endpoint: 'submit-video-answer',
      limit: ANSWER_LIMIT,
      windowSeconds: ANSWER_WINDOW_SECONDS,
    })
    if (!rate.ok) return rate.response

    // Verify caller owns a claim for this candidate. Storage RLS already
    // gates the upload itself; this check stops a different claimed user
    // from finalizing someone else's video into the answers table.
    const { data: claim } = await supabaseAdmin
      .from('candidate_claims')
      .select('candidate_id')
      .eq('user_id', user.id)
      .eq('candidate_id', candidateId)
      .maybeSingle()

    if (!claim) {
      return jsonError(403, { error: 'You do not own a claim for this candidate' })
    }

    const { data: question } = await supabaseAdmin
      .from('questions')
      .select('id, candidate_id, state')
      .eq('id', questionId)
      .maybeSingle()

    if (!question) {
      return jsonError(404, { error: 'Question not found' })
    }
    if (question.candidate_id !== candidateId) {
      return jsonError(403, { error: 'Question does not belong to this candidate' })
    }

    const { data: video, error: videoErr } = await supabaseAdmin
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

    const { error: updateErr } = await supabaseAdmin
      .from('questions')
      .update({
        state: 'answered',
        answer_video_id: video.id,
      })
      .eq('id', questionId)

    if (updateErr) throw updateErr

    return new Response(JSON.stringify(video), {
      status: 201,
      headers: JSON_HEADERS,
    })
  } catch (err) {
    return jsonResponse(500, {
      error: (err as Error)?.message ?? 'Internal server error',
    })
  }
})
