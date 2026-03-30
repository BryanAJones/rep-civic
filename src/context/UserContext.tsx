import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { District, QuestionId } from '../types/domain';

// SECURITY: Only non-sensitive app state belongs in UserState / localStorage.
// Session tokens, auth credentials, and user PII must NEVER be stored here.
// When auth is added, use HttpOnly cookies managed by the server.

interface UserState {
  hasCompletedOnboarding: boolean;
  districts: District[];
  votedQuestionIds: Set<QuestionId>;
}

type UserAction =
  | { type: 'COMPLETE_ONBOARDING'; districts: District[] }
  | { type: 'VOTE_QUESTION'; questionId: QuestionId }
  | { type: 'UNVOTE_QUESTION'; questionId: QuestionId }
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
    case 'RESET':
      next = {
        hasCompletedOnboarding: false,
        districts: [],
        votedQuestionIds: new Set(),
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
