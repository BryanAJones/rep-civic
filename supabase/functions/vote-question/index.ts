import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { jsonError, jsonResponse, JSON_HEADERS, requireVerifiedUser } from '../_shared/auth.ts'
import { checkRateLimit } from '../_shared/rateLimit.ts'

const VOTE_LIMIT = 30
const VOTE_WINDOW_SECONDS = 60

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { questionId } = await req.json()

    if (!questionId || typeof questionId !== 'string') {
      return jsonError(400, { error: 'questionId is required' })
    }

    const auth = await requireVerifiedUser(req)
    if (!auth.ok) return auth.response

    const { user, supabaseAdmin } = auth

    const rate = await checkRateLimit({
      supabase: supabaseAdmin,
      userId: user.id,
      endpoint: 'vote-question',
      limit: VOTE_LIMIT,
      windowSeconds: VOTE_WINDOW_SECONDS,
    })
    if (!rate.ok) return rate.response

    const { error: voteErr } = await supabaseAdmin
      .from('question_votes')
      .insert({ user_id: user.id, question_id: questionId })

    if (voteErr) {
      // 23505 = unique_violation (already voted)
      if (voteErr.code === '23505') {
        return jsonError(409, { error: 'Already voted on this question' })
      }
      throw voteErr
    }

    const { data: newCount, error: rpcErr } = await supabaseAdmin
      .rpc('increment_plus_one', { qid: questionId })

    if (rpcErr) throw rpcErr

    return new Response(JSON.stringify({ newCount }), {
      status: 200,
      headers: JSON_HEADERS,
    })
  } catch (err) {
    return jsonResponse(500, {
      error: (err as Error)?.message ?? 'Internal server error',
    })
  }
})
