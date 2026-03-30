import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { questionId, userId } = await req.json()

    if (!questionId || typeof questionId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'questionId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (!userId || typeof userId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Atomic: insert vote record (ON CONFLICT = already voted) + increment count
    // Step 1: Try to insert the vote record
    const { error: voteErr } = await supabase
      .from('question_votes')
      .insert({ user_id: userId, question_id: questionId })

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

    // Step 2: Atomic increment via RPC or raw SQL
    // Use .rpc if available, otherwise update with subquery
    const { data: updated, error: updateErr } = await supabase
      .rpc('increment_plus_one', { qid: questionId })

    if (updateErr) {
      // If RPC doesn't exist yet, fall back to read-then-write
      // (will be replaced by RPC after migration)
      const { data: current } = await supabase
        .from('questions')
        .select('plus_one_count')
        .eq('id', questionId)
        .single()

      const newCount = (current?.plus_one_count ?? 0) + 1

      const { error: fallbackErr } = await supabase
        .from('questions')
        .update({ plus_one_count: newCount })
        .eq('id', questionId)

      if (fallbackErr) throw fallbackErr

      return new Response(
        JSON.stringify({ newCount }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({ newCount: updated }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message ?? 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
