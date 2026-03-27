import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { buildDistrict } from '../test/mock-data';

// We need to dynamically import UserContext so we can reset the module
// between tests that verify localStorage hydration (initialState is
// computed at module load time).

function getModule() {
  return import('./UserContext');
}

describe('UserContext', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  it('useUser throws outside UserProvider', async () => {
    const { useUser } = await getModule();
    expect(() => {
      renderHook(() => useUser());
    }).toThrow('useUser must be used within UserProvider');
  });

  it('provides default state when no localStorage exists', async () => {
    const { useUser, UserProvider } = await getModule();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <UserProvider>{children}</UserProvider>
    );

    const { result } = renderHook(() => useUser(), { wrapper });
    expect(result.current.state.hasCompletedOnboarding).toBe(false);
    expect(result.current.state.districts).toEqual([]);
    expect(result.current.state.votedQuestionIds.size).toBe(0);
  });

  it('COMPLETE_ONBOARDING stores districts and flips flag', async () => {
    const { useUser, UserProvider } = await getModule();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <UserProvider>{children}</UserProvider>
    );
    const districts = [buildDistrict({ code: 'GA-SEN-D40' })];

    const { result } = renderHook(() => useUser(), { wrapper });
    act(() => {
      result.current.dispatch({ type: 'COMPLETE_ONBOARDING', districts });
    });

    expect(result.current.state.hasCompletedOnboarding).toBe(true);
    expect(result.current.state.districts).toEqual(districts);
  });

  it('VOTE_QUESTION adds to votedQuestionIds Set', async () => {
    const { useUser, UserProvider } = await getModule();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <UserProvider>{children}</UserProvider>
    );

    const { result } = renderHook(() => useUser(), { wrapper });
    act(() => {
      result.current.dispatch({ type: 'VOTE_QUESTION', questionId: 'q-001' });
    });

    expect(result.current.state.votedQuestionIds.has('q-001')).toBe(true);
    expect(result.current.state.votedQuestionIds.size).toBe(1);
  });

  it('RESET clears all state', async () => {
    const { useUser, UserProvider } = await getModule();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <UserProvider>{children}</UserProvider>
    );

    const { result } = renderHook(() => useUser(), { wrapper });
    act(() => {
      result.current.dispatch({
        type: 'COMPLETE_ONBOARDING',
        districts: [buildDistrict()],
      });
      result.current.dispatch({ type: 'VOTE_QUESTION', questionId: 'q-001' });
    });
    act(() => {
      result.current.dispatch({ type: 'RESET' });
    });

    expect(result.current.state.hasCompletedOnboarding).toBe(false);
    expect(result.current.state.districts).toEqual([]);
    expect(result.current.state.votedQuestionIds.size).toBe(0);
  });

  it('persists state to localStorage after dispatch', async () => {
    const { useUser, UserProvider } = await getModule();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <UserProvider>{children}</UserProvider>
    );

    const { result } = renderHook(() => useUser(), { wrapper });
    act(() => {
      result.current.dispatch({ type: 'VOTE_QUESTION', questionId: 'q-002' });
    });

    const stored = JSON.parse(localStorage.getItem('rep_user_state')!);
    expect(stored.votedQuestionIds).toContain('q-002');
  });

  it('hydrates state from localStorage on mount', async () => {
    localStorage.setItem(
      'rep_user_state',
      JSON.stringify({
        hasCompletedOnboarding: true,
        districts: [buildDistrict({ code: 'GA-HD-D55' })],
        votedQuestionIds: ['q-100', 'q-200'],
      }),
    );

    const { useUser, UserProvider } = await getModule();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <UserProvider>{children}</UserProvider>
    );

    const { result } = renderHook(() => useUser(), { wrapper });
    expect(result.current.state.hasCompletedOnboarding).toBe(true);
    expect(result.current.state.districts[0]!.code).toBe('GA-HD-D55');
    expect(result.current.state.votedQuestionIds.has('q-100')).toBe(true);
    expect(result.current.state.votedQuestionIds.has('q-200')).toBe(true);
  });

  it('gracefully handles corrupt localStorage', async () => {
    localStorage.setItem('rep_user_state', 'not-valid-json');

    const { useUser, UserProvider } = await getModule();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <UserProvider>{children}</UserProvider>
    );

    const { result } = renderHook(() => useUser(), { wrapper });
    expect(result.current.state.hasCompletedOnboarding).toBe(false);
    expect(result.current.state.districts).toEqual([]);
    expect(result.current.state.votedQuestionIds.size).toBe(0);
  });
});
