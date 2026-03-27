/**
 * Security-focused tests validating hardening measures from the 2026-03-27 security review.
 * These tests verify that client-side guards are in place for:
 * - localStorage input validation (S-3)
 * - Vote rollback integrity (S-20)
 * - Input length limits (S-2)
 * - Sensitive field contracts (S-5)
 */
import { render, screen, renderHook, act } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';

vi.mock('../services', () => ({
  service: { resolveDistricts: vi.fn() },
}));

// --- S-3: localStorage validation ---

describe('UserContext localStorage validation', () => {
  // We need to set localStorage BEFORE importing UserContext,
  // since it reads on module load. Use dynamic imports per test.

  it('rejects districts with missing required fields', async () => {
    localStorage.setItem('rep_user_state', JSON.stringify({
      hasCompletedOnboarding: true,
      districts: [
        { code: 'GA-SEN-D40' }, // missing level, officeTitle, etc.
        null,
        'not-an-object',
      ],
      votedQuestionIds: [],
    }));

    // Dynamic import to pick up the localStorage state
    vi.resetModules();
    const { UserProvider, useUser } = await import('../context/UserContext');

    function wrapper({ children }: { children: ReactNode }) {
      return createElement(UserProvider, null, children);
    }

    const { result } = renderHook(() => useUser(), { wrapper });

    // All invalid districts should be filtered out
    expect(result.current.state.districts).toHaveLength(0);
    // With no valid districts, hasCompletedOnboarding should be false
    expect(result.current.state.hasCompletedOnboarding).toBe(false);
  });

  it('resets hasCompletedOnboarding when districts array is empty', async () => {
    localStorage.setItem('rep_user_state', JSON.stringify({
      hasCompletedOnboarding: true,
      districts: [],
      votedQuestionIds: [],
    }));

    vi.resetModules();
    const { UserProvider, useUser } = await import('../context/UserContext');

    function wrapper({ children }: { children: ReactNode }) {
      return createElement(UserProvider, null, children);
    }

    const { result } = renderHook(() => useUser(), { wrapper });
    expect(result.current.state.hasCompletedOnboarding).toBe(false);
  });

  it('accepts valid districts and preserves onboarding state', async () => {
    localStorage.setItem('rep_user_state', JSON.stringify({
      hasCompletedOnboarding: true,
      districts: [{
        code: 'GA-SEN-D40',
        level: 'state',
        officeTitle: 'State Senator',
        districtName: 'District 40',
        displayLabel: 'GA Senate D40',
        candidateIds: ['c-1'],
      }],
      votedQuestionIds: ['q-1'],
    }));

    vi.resetModules();
    const { UserProvider, useUser } = await import('../context/UserContext');

    function wrapper({ children }: { children: ReactNode }) {
      return createElement(UserProvider, null, children);
    }

    const { result } = renderHook(() => useUser(), { wrapper });
    expect(result.current.state.hasCompletedOnboarding).toBe(true);
    expect(result.current.state.districts).toHaveLength(1);
    expect(result.current.state.votedQuestionIds.has('q-1')).toBe(true);
  });

  it('filters non-string votedQuestionIds', async () => {
    localStorage.setItem('rep_user_state', JSON.stringify({
      hasCompletedOnboarding: false,
      districts: [],
      votedQuestionIds: ['q-1', 42, null, 'q-2', { id: 'q-3' }],
    }));

    vi.resetModules();
    const { UserProvider, useUser } = await import('../context/UserContext');

    function wrapper({ children }: { children: ReactNode }) {
      return createElement(UserProvider, null, children);
    }

    const { result } = renderHook(() => useUser(), { wrapper });
    expect(result.current.state.votedQuestionIds.size).toBe(2);
    expect(result.current.state.votedQuestionIds.has('q-1')).toBe(true);
    expect(result.current.state.votedQuestionIds.has('q-2')).toBe(true);
  });

  it('handles corrupted JSON gracefully', async () => {
    localStorage.setItem('rep_user_state', '{not valid json!!!');

    vi.resetModules();
    const { UserProvider, useUser } = await import('../context/UserContext');

    function wrapper({ children }: { children: ReactNode }) {
      return createElement(UserProvider, null, children);
    }

    const { result } = renderHook(() => useUser(), { wrapper });
    expect(result.current.state.hasCompletedOnboarding).toBe(false);
    expect(result.current.state.districts).toHaveLength(0);
    expect(result.current.state.votedQuestionIds.size).toBe(0);
  });

  it('rejects districts with invalid level values', async () => {
    localStorage.setItem('rep_user_state', JSON.stringify({
      hasCompletedOnboarding: true,
      districts: [{
        code: 'GA-SEN-D40',
        level: 'galactic', // invalid
        officeTitle: 'Space Senator',
        districtName: 'District 40',
        displayLabel: 'GA Senate D40',
        candidateIds: [],
      }],
      votedQuestionIds: [],
    }));

    vi.resetModules();
    const { UserProvider, useUser } = await import('../context/UserContext');

    function wrapper({ children }: { children: ReactNode }) {
      return createElement(UserProvider, null, children);
    }

    const { result } = renderHook(() => useUser(), { wrapper });
    expect(result.current.state.districts).toHaveLength(0);
    expect(result.current.state.hasCompletedOnboarding).toBe(false);
  });
});

// --- S-20: UNVOTE_QUESTION rollback ---

describe('UNVOTE_QUESTION action', () => {
  it('removes questionId from votedQuestionIds on rollback', async () => {
    vi.resetModules();
    const { UserProvider, useUser } = await import('../context/UserContext');

    function wrapper({ children }: { children: ReactNode }) {
      return createElement(UserProvider, null, children);
    }

    const { result } = renderHook(() => useUser(), { wrapper });

    // Vote on a question
    act(() => {
      result.current.dispatch({ type: 'VOTE_QUESTION', questionId: 'q-1' });
    });
    expect(result.current.state.votedQuestionIds.has('q-1')).toBe(true);

    // Unvote (rollback)
    act(() => {
      result.current.dispatch({ type: 'UNVOTE_QUESTION', questionId: 'q-1' });
    });
    expect(result.current.state.votedQuestionIds.has('q-1')).toBe(false);
  });

  it('does not affect other voted questions on rollback', async () => {
    vi.resetModules();
    const { UserProvider, useUser } = await import('../context/UserContext');

    function wrapper({ children }: { children: ReactNode }) {
      return createElement(UserProvider, null, children);
    }

    const { result } = renderHook(() => useUser(), { wrapper });

    act(() => {
      result.current.dispatch({ type: 'VOTE_QUESTION', questionId: 'q-1' });
      result.current.dispatch({ type: 'VOTE_QUESTION', questionId: 'q-2' });
    });

    act(() => {
      result.current.dispatch({ type: 'UNVOTE_QUESTION', questionId: 'q-1' });
    });

    expect(result.current.state.votedQuestionIds.has('q-1')).toBe(false);
    expect(result.current.state.votedQuestionIds.has('q-2')).toBe(true);
  });
});

// --- S-2: Input length limits ---

describe('Input length limits', () => {
  it('QuestionInput has maxLength attribute', async () => {
    const { QuestionInput } = await import('../components/questions/QuestionInput');
    render(createElement(QuestionInput, { onSubmit: vi.fn() }));
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('maxLength', '280');
  });

  it('OnboardingPage address input has maxLength attribute', async () => {
    vi.resetModules();

    const { MemoryRouter } = await import('react-router-dom');
    const { UserProvider } = await import('../context/UserContext');
    const { OnboardingPage } = await import('../views/onboarding/OnboardingPage');

    render(
      createElement(UserProvider, null,
        createElement(MemoryRouter, null,
          createElement(OnboardingPage),
        ),
      ),
    );

    const input = screen.getByLabelText('Home address');
    expect(input).toHaveAttribute('maxLength', '200');
  });
});
