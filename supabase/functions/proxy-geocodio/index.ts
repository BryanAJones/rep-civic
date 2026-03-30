import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const GEOCODIO_BASE = 'https://api.geocod.io/v1.7/geocode'
const MAX_ADDRESS_LENGTH = 200

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { address } = await req.json()

    if (!address || typeof address !== 'string' || address.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (address.length > MAX_ADDRESS_LENGTH) {
      return new Response(
        JSON.stringify({ error: `address must be ${MAX_ADDRESS_LENGTH} characters or fewer` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const apiKey = Deno.env.get('GEOCODIO_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Geocodio API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const url = new URL(GEOCODIO_BASE)
    url.searchParams.set('q', address.trim())
    url.searchParams.set('fields', 'cd,stateleg')
    url.searchParams.set('api_key', apiKey)

    const response = await fetch(url.toString())

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Geocodio API error: ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const data = await response.json()

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message ?? 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
