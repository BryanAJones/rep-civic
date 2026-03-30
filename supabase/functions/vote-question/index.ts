import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

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

    // Use service_role for the write operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

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

    if (rpcErr) {
      // Fallback if RPC not deployed yet
      const { data: current } = await supabase
        .from('questions')
        .select('plus_one_count')
        .eq('id', questionId)
        .single()

      const count = (current?.plus_one_count ?? 0) + 1

      await supabase
        .from('questions')
        .update({ plus_one_count: count })
        .eq('id', questionId)

      return new Response(
        JSON.stringify({ newCount: count }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

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
