// Persistent record of an action a user attempted before they were
// email-verified. The magic-link flow takes the user away from the app
// (to their inbox) and back; the intent survives that round-trip and
// the runner replays it once the AUTH_UPGRADED event lands.
//
// Stored in localStorage rather than UserContext because the magic-link
// callback may load in a fresh tab where React state has been reset.

import type { CandidateId, QuestionId, VideoId } from '../types/domain';

export type PendingIntent =
  | { type: 'vote'; questionId: QuestionId; createdAt: number }
  | {
      type: 'submit-question';
      candidateId: CandidateId;
      videoId: VideoId | null;
      topicId: string | null;
      text: string;
      createdAt: number;
    }
  | { type: 'claim'; candidateId: CandidateId; createdAt: number };

// Distributive Omit so the discriminant on each union member is preserved.
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type PendingIntentInput = DistributiveOmit<PendingIntent, 'createdAt'>;

const STORAGE_KEY = 'rep_pending_intent';
const TTL_MS = 30 * 60 * 1000;

export function setPendingIntent(intent: PendingIntentInput): void {
  try {
    const stamped = { ...intent, createdAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stamped));
  } catch {
    // localStorage may be unavailable (private mode, quota); intent just won't persist
  }
}

export function getPendingIntent(): PendingIntent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingIntent;
    if (typeof parsed.createdAt !== 'number' || Date.now() - parsed.createdAt > TTL_MS) {
      clearPendingIntent();
      return null;
    }
    if (!isValidIntent(parsed)) {
      clearPendingIntent();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingIntent(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}

function isValidIntent(intent: PendingIntent): boolean {
  switch (intent.type) {
    case 'vote':
      return typeof intent.questionId === 'string' && intent.questionId.length > 0;
    case 'submit-question':
      return (
        typeof intent.candidateId === 'string' &&
        typeof intent.text === 'string' &&
        intent.text.trim().length > 0
      );
    case 'claim':
      return typeof intent.candidateId === 'string' && intent.candidateId.length > 0;
    default:
      return false;
  }
}
