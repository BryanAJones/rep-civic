import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';
import type { District, QuestionId } from '../types/domain';
import { supabase, ensureAnonymousSession } from '../services/supabaseClient';

// SECURITY: Only non-sensitive app state belongs in UserState / localStorage.
// Session tokens, auth credentials, and user PII must NEVER be stored here.
// Auth state is managed by Supabase (HttpOnly-style localStorage session).

interface UserState {
  hasCompletedOnboarding: boolean;
  districts: District[];
  votedQuestionIds: Set<QuestionId>;
  authUserId: string | null;
  handle: string | null;
  email: string | null;
  isAnonymous: boolean;
  authReady: boolean;
  authError: string | null;
}

type UserAction =
  | { type: 'COMPLETE_ONBOARDING'; districts: District[] }
  | { type: 'VOTE_QUESTION'; questionId: QuestionId }
  | { type: 'UNVOTE_QUESTION'; questionId: QuestionId }
  | {
      type: 'AUTH_READY';
      userId: string;
      handle: string | null;
      email: string | null;
      isAnonymous: boolean;
      votedQuestionIds: Set<QuestionId>;
    }
  | { type: 'AUTH_UPGRADED'; email: string; handle: string }
  | { type: 'HANDLE_UPDATED'; handle: string }
  | { type: 'AUTH_ERROR'; error: string }
  | { type: 'RESET' };

const STORAGE_KEY = 'rep_user_state';

function isValidDistrict(d: unknown): d is District {
  if (typeof d !== 'object' || d === null) return false;
  const obj = d as Record<string, unknown>;
  return (
    typeof obj.code === 'string' && obj.code.length > 0 &&
    typeof obj.level === 'string' && ['city', 'county', 'state', 'federal'].includes(obj.level) &&
    typeof obj.officeTitle === 'string' &&
    typeof obj.districtName === 'string' &&
    typeof obj.displayLabel === 'string' &&
    Array.isArray(obj.candidateIds)
  );
}

function loadFromStorage(): Partial<UserState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const districts = Array.isArray(parsed.districts)
      ? parsed.districts.filter(isValidDistrict)
      : [];
    const hasCompletedOnboarding = parsed.hasCompletedOnboarding === true && districts.length > 0;
    return {
      hasCompletedOnboarding,
      districts,
      votedQuestionIds: new Set(
        Array.isArray(parsed.votedQuestionIds)
          ? parsed.votedQuestionIds.filter((id: unknown) => typeof id === 'string')
          : [],
      ),
    };
  } catch {
    return {};
  }
}

function saveToStorage(state: UserState) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        districts: state.districts,
        votedQuestionIds: [...state.votedQuestionIds],
      }),
    );
  } catch {
    // localStorage may be unavailable
  }
}

const stored = loadFromStorage();

const initialState: UserState = {
  hasCompletedOnboarding: stored.hasCompletedOnboarding ?? false,
  districts: stored.districts ?? [],
  votedQuestionIds: stored.votedQuestionIds ?? new Set(),
  authUserId: null,
  handle: null,
  email: null,
  isAnonymous: true,
  authReady: false,
  authError: null,
};

function userReducer(state: UserState, action: UserAction): UserState {
  let next: UserState;

  switch (action.type) {
    case 'COMPLETE_ONBOARDING':
      next = {
        ...state,
        hasCompletedOnboarding: true,
        districts: action.districts,
      };
      break;
    case 'VOTE_QUESTION': {
      const newVoted = new Set(state.votedQuestionIds);
      newVoted.add(action.questionId);
      next = { ...state, votedQuestionIds: newVoted };
      break;
    }
    case 'UNVOTE_QUESTION': {
      const reduced = new Set(state.votedQuestionIds);
      reduced.delete(action.questionId);
      next = { ...state, votedQuestionIds: reduced };
      break;
    }
    case 'AUTH_READY':
      next = {
        ...state,
        authUserId: action.userId,
        handle: action.handle,
        email: action.email,
        isAnonymous: action.isAnonymous,
        votedQuestionIds: new Set([...state.votedQuestionIds, ...action.votedQuestionIds]),
        authReady: true,
      };
      break;
    case 'AUTH_UPGRADED':
      next = {
        ...state,
        email: action.email,
        handle: action.handle,
        isAnonymous: false,
      };
      break;
    case 'HANDLE_UPDATED':
      next = {
        ...state,
        handle: action.handle,
      };
      break;
    case 'AUTH_ERROR':
      next = {
        ...state,
        authError: action.error,
        authReady: true,
      };
      break;
    case 'RESET':
      next = {
        hasCompletedOnboarding: false,
        districts: [],
        votedQuestionIds: new Set(),
        authUserId: null,
        handle: null,
        email: null,
        isAnonymous: true,
        authReady: false,
        authError: null,
      };
      break;
    default:
      return state;
  }

  saveToStorage(next);
  return next;
}

const UserContext = createContext<{
  state: UserState;
  dispatch: React.Dispatch<UserAction>;
} | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(userReducer, initialState);

  // Initialize anonymous auth + hydrate vote history on mount
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const userId = await ensureAnonymousSession();
        if (cancelled) return;

        // Fetch user profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('handle, email, is_anonymous')
          .eq('id', userId)
          .single();

        // Fetch voted question IDs
        const { data: votes } = await supabase
          .from('question_votes')
          .select('question_id')
          .eq('user_id', userId);

        const serverVotes = new Set<QuestionId>(
          (votes ?? []).map((v) => v.question_id),
        );

        if (!cancelled) {
          dispatch({
            type: 'AUTH_READY',
            userId,
            handle: profile?.handle ?? null,
            email: profile?.email ?? null,
            isAnonymous: profile?.is_anonymous ?? true,
            votedQuestionIds: serverVotes,
          });
        }
      } catch (err) {
        if (!cancelled) {
          dispatch({
            type: 'AUTH_ERROR',
            error: err instanceof Error ? err.message : 'Authentication failed',
          });
        }
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  // Listen for auth state changes (magic link callback)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user && !session.user.is_anonymous) {
          // User upgraded from anonymous to authenticated via magic link
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('handle')
            .eq('id', session.user.id)
            .single();

          dispatch({
            type: 'AUTH_UPGRADED',
            email: session.user.email ?? '',
            handle: profile?.handle ?? state.handle ?? '',
          });
        }
      },
    );

    return () => { subscription.unsubscribe(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <UserContext.Provider value={{ state, dispatch }}>
      {children}
    </UserContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
