// Shared rate-limit helper for Edge Functions.
//
// Wraps the check_rate_limit RPC (S-15) and returns either ok: true with
// the current count, or ok: false with a pre-built 429 Response carrying
// the Retry-After header. Mirrors the requireVerifiedUser shape so
// callers can just check `if (!result.ok) return result.response`.

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { JSON_HEADERS } from './auth.ts'

export type RateLimitOk = { ok: true; currentCount: number }
export type RateLimitFailure = { ok: false; response: Response }
export type RateLimitResult = RateLimitOk | RateLimitFailure

export async function checkRateLimit(args: {
  supabase: SupabaseClient
  userId: string
  endpoint: string
  limit: number
  windowSeconds: number
}): Promise<RateLimitResult> {
  const { supabase, userId, endpoint, limit, windowSeconds } = args
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_user: userId,
    p_endpoint: endpoint,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  })
  if (error) throw error
  const verdict = Array.isArray(data) ? data[0] : data
  if (verdict && verdict.allowed === false) {
    const retry = verdict.retry_after_seconds ?? 1
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: 'Rate limit exceeded', retryAfterSeconds: retry }),
        {
          status: 429,
          headers: { ...JSON_HEADERS, 'Retry-After': String(retry) },
        },
      ),
    }
  }
  return { ok: true, currentCount: verdict?.current_count ?? 0 }
}
