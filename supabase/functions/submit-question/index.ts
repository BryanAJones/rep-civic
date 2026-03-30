import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const MAX_QUESTION_LENGTH = 280

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

    // Use service_role to bypass RLS for writes
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

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

    // Server-derived authorHandle — anonymous until auth (B4)
    const authorHandle = '@anonymous'

    const { data, error } = await supabase
      .from('questions')
      .insert({
        candidate_id: candidateId,
        video_id: videoId ?? null,
        text: text.trim(),
        topic_id: topicId ?? null,
        author_handle: authorHandle,
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
