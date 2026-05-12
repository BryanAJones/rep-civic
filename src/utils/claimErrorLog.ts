// Client-side error capture for the verify-candidate-claim flow (B6-12).
//
// `supabase.functions.invoke` returns a FunctionsHttpError whose
// `context.response` is a real Response object — to inspect the body
// (and surface the Edge Function's `code` / problem-detail field) we
// have to clone and parse the response. This util consolidates that
// extraction, writes a structured detail to the console, and persists
// the last few errors to localStorage so a user dogfooding on mobile
// (no DevTools) can retrieve them after the fact.

const STORAGE_KEY = '__rep.claimErrors';
const MAX_ENTRIES = 10;

export type ClaimErrorAction =
  | 'verify-candidate-claim:initiate'
  | 'verify-candidate-claim:finalize';

export interface ClaimErrorContext {
  candidateId?: string;
  level?: 'federal' | 'state' | 'local';
  filingId?: string;
  isAnonymous?: boolean;
}

export interface ClaimErrorDetail {
  timestamp: string;
  action: ClaimErrorAction;
  status: number | null;
  code: string | null;
  message: string;
  body: unknown;
  context: ClaimErrorContext;
  userAgent: string;
}

// Extract a structured detail from a thrown error. Best-effort: returns a
// detail even if the error shape is unfamiliar (so the caller can always
// log something).
export async function extractClaimError(
  action: ClaimErrorAction,
  context: ClaimErrorContext,
  err: unknown,
): Promise<ClaimErrorDetail> {
  const detail: ClaimErrorDetail = {
    timestamp: new Date().toISOString(),
    action,
    status: null,
    code: null,
    message: '',
    body: null,
    context,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  };

  if (!err || typeof err !== 'object') {
    detail.message = String(err ?? 'Unknown error');
    return detail;
  }

  detail.message = (err as { message?: string }).message ?? 'Unknown error';

  const response = (err as { context?: { response?: Response } }).context?.response;
  if (response && typeof response.clone === 'function') {
    detail.status = typeof response.status === 'number' ? response.status : null;
    try {
      const body = await response.clone().json();
      detail.body = body;
      if (
        body &&
        typeof body === 'object' &&
        typeof (body as { code?: unknown }).code === 'string'
      ) {
        detail.code = (body as { code: string }).code;
      }
    } catch {
      try {
        detail.body = await response.clone().text();
      } catch {
        // Body unreadable — leave as null.
      }
    }
  }

  return detail;
}

// Write a structured detail to console.error and append to a localStorage
// ring buffer. Never throws — a logger that breaks the surrounding flow
// is worse than no logger.
export function logClaimError(detail: ClaimErrorDetail): void {
  try {
    console.error('[claim-error]', detail);
  } catch {
    // Console unavailable in some sandboxed contexts.
  }

  if (typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const entries: ClaimErrorDetail[] = Array.isArray(parsed) ? parsed : [];
    entries.unshift(detail);
    if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Quota, parse, or serialization errors — swallow.
  }
}

export function getRecentClaimErrors(): ClaimErrorDetail[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ClaimErrorDetail[]) : [];
  } catch {
    return [];
  }
}

export function clearClaimErrors(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

// Pure mapping from structured detail to user-facing copy. Replaces the
// previous inline `errorToCopy` which read non-existent `context.status`
// and `context.body.code` properties on the FunctionsHttpError shape.
export function claimErrorToCopy(detail: ClaimErrorDetail): string {
  const { status, code, message } = detail;
  if (status === 404) return "That filing ID doesn't match this candidate.";
  if (status === 409) return 'This profile already has a pending claim or has been claimed.';
  if (status === 429) {
    if (code === 'OTP_RATE_LIMIT') {
      return "We've sent too many verification emails recently. Try again in about an hour.";
    }
    return 'Too many attempts. Try again in an hour.';
  }
  if (status === 501) {
    return 'Only federal verification is live in phase 1. Other levels are rolling out.';
  }
  if (status === 502) return 'Could not reach FEC. Try again in a moment.';
  return message || 'Could not verify. Try again in a moment.';
}
