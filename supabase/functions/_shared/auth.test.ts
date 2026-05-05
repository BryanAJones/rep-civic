// Deno tests for the shared auth helper.
// Run with: npx supabase functions serve (or `deno test --allow-env`)
// from the supabase/functions directory.

import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { requireVerifiedUser, type AuthDeps } from './auth.ts'

// Minimal stub that satisfies the SupabaseClient shape the helper touches.
function stubAnonClient(getUserResult: { data: { user: unknown } | null; error: unknown }): unknown {
  return {
    auth: {
      getUser: () => Promise.resolve(getUserResult),
    },
  }
}

function stubAdminClient(): unknown {
  return { from: () => ({}) }
}

function makeReq(headers: Record<string, string> = {}): Request {
  return new Request('https://example.com/', { method: 'POST', headers })
}

function deps(anonResult: { data: { user: unknown } | null; error: unknown }): AuthDeps {
  return {
    // deno-lint-ignore no-explicit-any
    createAnonClient: () => stubAnonClient(anonResult) as any,
    // deno-lint-ignore no-explicit-any
    createAdminClient: () => stubAdminClient() as any,
  }
}

Deno.test('requireVerifiedUser: missing Authorization header → 401', async () => {
  const result = await requireVerifiedUser(makeReq())
  assertEquals(result.ok, false)
  if (result.ok) return
  assertEquals(result.response.status, 401)
  const body = await result.response.json()
  assertEquals(body.error, 'Authentication required')
})

Deno.test('requireVerifiedUser: invalid JWT → 401', async () => {
  const result = await requireVerifiedUser(
    makeReq({ Authorization: 'Bearer bad-token' }),
    deps({ data: null, error: new Error('jwt expired') }),
  )
  assertEquals(result.ok, false)
  if (result.ok) return
  assertEquals(result.response.status, 401)
  const body = await result.response.json()
  assertEquals(body.error, 'Invalid authentication')
})

Deno.test('requireVerifiedUser: getUser returns no user → 401', async () => {
  const result = await requireVerifiedUser(
    makeReq({ Authorization: 'Bearer token' }),
    deps({ data: { user: null }, error: null }),
  )
  assertEquals(result.ok, false)
  if (result.ok) return
  assertEquals(result.response.status, 401)
})

Deno.test('requireVerifiedUser: anonymous user → 403 EMAIL_REQUIRED', async () => {
  const result = await requireVerifiedUser(
    makeReq({ Authorization: 'Bearer token' }),
    deps({ data: { user: { id: 'u1', is_anonymous: true } }, error: null }),
  )
  assertEquals(result.ok, false)
  if (result.ok) return
  assertEquals(result.response.status, 403)
  const body = await result.response.json()
  assertEquals(body.code, 'EMAIL_REQUIRED')
})

Deno.test('requireVerifiedUser: verified user → ok with user + admin client', async () => {
  const verifiedUser = { id: 'u1', is_anonymous: false, email: 'a@b.com' }
  const result = await requireVerifiedUser(
    makeReq({ Authorization: 'Bearer token' }),
    deps({ data: { user: verifiedUser }, error: null }),
  )
  assertEquals(result.ok, true)
  if (!result.ok) return
  // deno-lint-ignore no-explicit-any
  assertEquals((result.user as any).id, 'u1')
  assertEquals(typeof result.supabaseAdmin, 'object')
})

Deno.test('requireVerifiedUser: passes auth header to anon client factory', async () => {
  let capturedHeader: string | null = null
  const result = await requireVerifiedUser(makeReq({ Authorization: 'Bearer abc.def.ghi' }), {
    createAnonClient: (h) => {
      capturedHeader = h
      // deno-lint-ignore no-explicit-any
      return stubAnonClient({ data: { user: { id: 'u1', is_anonymous: false } }, error: null }) as any
    },
    // deno-lint-ignore no-explicit-any
    createAdminClient: () => stubAdminClient() as any,
  })
  assertEquals(result.ok, true)
  assertEquals(capturedHeader, 'Bearer abc.def.ghi')
})
