import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  claimErrorToCopy,
  clearClaimErrors,
  extractClaimError,
  getRecentClaimErrors,
  logClaimError,
  type ClaimErrorDetail,
} from './claimErrorLog';

function fakeFunctionsError(status: number, body: unknown): Error & {
  context: { response: Response };
} {
  const response = new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
  const err = new Error('Edge Function returned a non-2xx status code');
  return Object.assign(err, { context: { response } });
}

describe('extractClaimError', () => {
  it('captures status, code, and body from a FunctionsHttpError shape', async () => {
    const err = fakeFunctionsError(409, { code: 'PENDING_CLAIM_EXISTS', detail: 'try later' });
    const detail = await extractClaimError(
      'verify-candidate-claim:initiate',
      { candidateId: 'cand-1', level: 'federal', filingId: 'H6GA00000' },
      err,
    );
    expect(detail.status).toBe(409);
    expect(detail.code).toBe('PENDING_CLAIM_EXISTS');
    expect(detail.body).toEqual({ code: 'PENDING_CLAIM_EXISTS', detail: 'try later' });
    expect(detail.action).toBe('verify-candidate-claim:initiate');
    expect(detail.context.candidateId).toBe('cand-1');
    expect(detail.message).toBe('Edge Function returned a non-2xx status code');
  });

  it('falls back to text body when JSON parsing fails', async () => {
    const response = new Response('plain text body', { status: 502 });
    const err = Object.assign(new Error('boom'), { context: { response } });
    const detail = await extractClaimError(
      'verify-candidate-claim:finalize',
      {},
      err,
    );
    expect(detail.status).toBe(502);
    expect(detail.code).toBeNull();
    expect(detail.body).toBe('plain text body');
  });

  it('returns a detail even when the error is a string', async () => {
    const detail = await extractClaimError(
      'verify-candidate-claim:initiate',
      {},
      'something went wrong',
    );
    expect(detail.status).toBeNull();
    expect(detail.code).toBeNull();
    expect(detail.message).toBe('something went wrong');
  });

  it('returns a detail when the error has no context.response', async () => {
    const detail = await extractClaimError(
      'verify-candidate-claim:initiate',
      {},
      new Error('network down'),
    );
    expect(detail.status).toBeNull();
    expect(detail.message).toBe('network down');
  });
});

describe('logClaimError ring buffer', () => {
  beforeEach(() => {
    clearClaimErrors();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('persists entries newest-first and caps at 10', () => {
    for (let i = 0; i < 15; i++) {
      logClaimError(makeDetail(`msg ${i}`));
    }
    const stored = getRecentClaimErrors();
    expect(stored).toHaveLength(10);
    expect(stored[0]?.message).toBe('msg 14');
    expect(stored[9]?.message).toBe('msg 5');
  });

  it('swallows quota errors without throwing', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => logClaimError(makeDetail('over quota'))).not.toThrow();
    setItemSpy.mockRestore();
  });

  it('returns an empty array when storage holds a non-array value', () => {
    localStorage.setItem('__rep.claimErrors', JSON.stringify({ not: 'an array' }));
    expect(getRecentClaimErrors()).toEqual([]);
  });

  it('clearClaimErrors removes the buffer', () => {
    logClaimError(makeDetail('one'));
    expect(getRecentClaimErrors()).toHaveLength(1);
    clearClaimErrors();
    expect(getRecentClaimErrors()).toHaveLength(0);
  });
});

describe('claimErrorToCopy', () => {
  it('maps known status codes to friendly copy', () => {
    expect(claimErrorToCopy(makeDetail('m', 404))).toMatch(/doesn't match/);
    expect(claimErrorToCopy(makeDetail('m', 409))).toMatch(/already has/);
    expect(claimErrorToCopy(makeDetail('m', 501))).toMatch(/federal verification/);
    expect(claimErrorToCopy(makeDetail('m', 502))).toMatch(/reach FEC/);
  });

  it('uses OTP_RATE_LIMIT body code to refine the 429 message', () => {
    const detail = makeDetail('rate limited', 429, 'OTP_RATE_LIMIT');
    expect(claimErrorToCopy(detail)).toMatch(/about an hour/);
  });

  it('falls back to a generic 429 copy when no specific code is set', () => {
    expect(claimErrorToCopy(makeDetail('m', 429))).toMatch(/Too many attempts/);
  });

  it('falls back to the error message when status is unknown', () => {
    expect(claimErrorToCopy(makeDetail('helpful detail'))).toBe('helpful detail');
  });

  it('falls back to a generic line when no message is available', () => {
    expect(claimErrorToCopy(makeDetail(''))).toMatch(/Could not verify/);
  });
});

function makeDetail(
  message: string,
  status: number | null = null,
  code: string | null = null,
): ClaimErrorDetail {
  return {
    timestamp: '2026-05-12T00:00:00.000Z',
    action: 'verify-candidate-claim:initiate',
    status,
    code,
    message,
    body: null,
    context: {},
    userAgent: 'test-agent',
  };
}
