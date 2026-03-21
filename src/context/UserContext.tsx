import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { District, QuestionId } from '../types/domain';

interface UserState {
  hasCompletedOnboarding: boolean;
  districts: District[];
  votedQuestionIds: Set<QuestionId>;
}

type UserAction =
  | { type: 'COMPLETE_ONBOARDING'; districts: District[] }
  | { type: 'VOTE_QUESTION'; questionId: QuestionId }
  | { type: 'RESET' };

const STORAGE_KEY = 'rep_user_state';

function loadFromStorage(): Partial<UserState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return {
      hasCompletedOnboarding: parsed.hasCompletedOnboarding ?? false,
      districts: parsed.districts ?? [],
      votedQuestionIds: new Set(parsed.votedQuestionIds ?? []),
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

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
