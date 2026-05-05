// Shared auth helper for Edge Functions.
//
// Replaces ~30 lines of identical boilerplate across submit-question,
// vote-question, claim-candidate, submit-video-answer, and the upcoming
// verify-candidate-claim. Returns either an authenticated, non-anonymous
// user with a service-role admin client, or a pre-built error Response
// the handler can return directly.

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2'

const JSON_HEADERS = { ...corsHeaders, 'Content-Type': 'application/json' }

function jsonError(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS })
}

export type AuthSuccess = {
  ok: true
  user: User
  supabaseAdmin: SupabaseClient
}

export type AuthFailure = {
  ok: false
  response: Response
}

export type AuthResult = AuthSuccess | AuthFailure

// Optional dependency injection for tests. Production paths use the default
// Supabase client factories below.
export type AuthDeps = {
  createAnonClient?: (authHeader: string) => SupabaseClient
  createAdminClient?: () => SupabaseClient
}

function defaultAnonClient(authHeader: string): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  )
}

function defaultAdminClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )
}

// requireVerifiedUser
//
// Authenticates the caller and gates anonymous sessions out. Returns an
// AuthSuccess with the resolved user and a service-role client for writes,
// or an AuthFailure carrying the Response the handler should return.
//
// Anonymous-session gate: anonymous users can read but cannot write.
// The is_anonymous check enforces the durable-identity floor — actions
// must be tied to a recoverable identity (verified email).
export async function requireVerifiedUser(
  req: Request,
  deps: AuthDeps = {},
): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return { ok: false, response: jsonError(401, { error: 'Authentication required' }) }
  }

  const anonClient = (deps.createAnonClient ?? defaultAnonClient)(authHeader)

  const { data, error } = await anonClient.auth.getUser()
  if (error || !data?.user) {
    return { ok: false, response: jsonError(401, { error: 'Invalid authentication' }) }
  }

  const user = data.user

  if (user.is_anonymous) {
    return {
      ok: false,
      response: jsonError(403, {
        error: 'Verify your email to continue.',
        code: 'EMAIL_REQUIRED',
      }),
    }
  }

  const supabaseAdmin = (deps.createAdminClient ?? defaultAdminClient)()
  return { ok: true, user, supabaseAdmin }
}
