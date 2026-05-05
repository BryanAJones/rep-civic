import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearPendingIntent, getPendingIntent, setPendingIntent } from './pendingIntent';

afterEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

describe('pendingIntent', () => {
  it('round-trips a vote intent', () => {
    setPendingIntent({ type: 'vote', questionId: 'q-1' });
    const got = getPendingIntent();
    expect(got).toMatchObject({ type: 'vote', questionId: 'q-1' });
    expect(got?.createdAt).toBeTypeOf('number');
  });

  it('round-trips a submit-question intent', () => {
    setPendingIntent({
      type: 'submit-question',
      candidateId: 'c-1',
      videoId: null,
      topicId: 'topic-a',
      text: 'why?',
    });
    const got = getPendingIntent();
    expect(got).toMatchObject({
      type: 'submit-question',
      candidateId: 'c-1',
      topicId: 'topic-a',
      text: 'why?',
    });
  });

  it('round-trips a claim intent', () => {
    setPendingIntent({ type: 'claim', candidateId: 'c-2' });
    expect(getPendingIntent()).toMatchObject({ type: 'claim', candidateId: 'c-2' });
  });

  it('returns null when nothing stored', () => {
    expect(getPendingIntent()).toBeNull();
  });

  it('expires after TTL', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-19T10:00:00Z'));
    setPendingIntent({ type: 'vote', questionId: 'q-1' });
    vi.setSystemTime(new Date('2026-04-19T10:31:00Z'));
    expect(getPendingIntent()).toBeNull();
  });

  it('rejects malformed stored payload', () => {
    localStorage.setItem('rep_pending_intent', '{"type":"vote"}');
    expect(getPendingIntent()).toBeNull();
  });

  it('clearPendingIntent removes the entry', () => {
    setPendingIntent({ type: 'vote', questionId: 'q-1' });
    clearPendingIntent();
    expect(getPendingIntent()).toBeNull();
  });
});
