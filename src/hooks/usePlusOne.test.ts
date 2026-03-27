import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { buildQuestion } from '../test/mock-data';
import { createMockService } from '../test/mock-service';
import type { Question } from '../types/domain';

const mockService = createMockService();

vi.mock('../services', () => ({
  service: mockService,
}));

// Must import after vi.mock
const { usePlusOne } = await import('./usePlusOne');
const { UserProvider, useUser } = await import('../context/UserContext');

function wrapper({ children }: { children: ReactNode }) {
  return createElement(UserProvider, null, children);
}

describe('usePlusOne', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('increments count and sets state to voted', async () => {
    const questions: Question[] = [
      buildQuestion({ id: 'q-1', plusOneCount: 5, state: 'default' }),
    ];
    let captured: Question[] = [];
    const setQuestions = vi.fn((updater: React.SetStateAction<Question[]>) => {
      if (typeof updater === 'function') {
        captured = updater(captured.length ? captured : questions);
      }
    });

    const { result } = renderHook(() => usePlusOne(setQuestions), { wrapper });
    await act(async () => {
      await result.current.vote('q-1');
    });

    expect(setQuestions).toHaveBeenCalled();
    expect(captured[0]!.plusOneCount).toBe(6);
    expect(captured[0]!.state).toBe('voted');
  });

  it('is a no-op when already voted', async () => {
    // Pre-populate votedQuestionIds by voting first
    const questions: Question[] = [
      buildQuestion({ id: 'q-1', plusOneCount: 5 }),
    ];
    let captured: Question[] = questions;
    const setQuestions = vi.fn((updater: React.SetStateAction<Question[]>) => {
      if (typeof updater === 'function') {
        captured = updater(captured);
      }
    });

    const { result } = renderHook(
      () => {
        const plusOne = usePlusOne(setQuestions);
        const { state } = useUser();
        return { ...plusOne, votedIds: state.votedQuestionIds };
      },
      { wrapper },
    );

    // First vote should work
    await act(async () => {
      await result.current.vote('q-1');
    });
    const callCountAfterFirst = setQuestions.mock.calls.length;

    // Second vote should be a no-op
    await act(async () => {
      await result.current.vote('q-1');
    });
    expect(setQuestions.mock.calls.length).toBe(callCountAfterFirst);
  });

  it('sorts questions by plusOneCount descending after vote', async () => {
    const questions: Question[] = [
      buildQuestion({ id: 'q-a', plusOneCount: 10 }),
      buildQuestion({ id: 'q-b', plusOneCount: 8 }),
    ];
    let captured: Question[] = [];
    const setQuestions = vi.fn((updater: React.SetStateAction<Question[]>) => {
      if (typeof updater === 'function') {
        captured = updater(captured.length ? captured : questions);
      }
    });

    const { result } = renderHook(() => usePlusOne(setQuestions), { wrapper });
    await act(async () => {
      await result.current.vote('q-b');
    });

    // q-a: 10, q-b: 9, so q-a should still be first
    expect(captured[0]!.id).toBe('q-a');
    expect(captured[1]!.id).toBe('q-b');
    expect(captured[1]!.plusOneCount).toBe(9);
  });

  it('rolls back on service error', async () => {
    mockService.voteQuestion = vi.fn().mockRejectedValue(new Error('Network error'));

    const questions: Question[] = [
      buildQuestion({ id: 'q-1', plusOneCount: 5, state: 'default' }),
    ];
    const allUpdates: Question[][] = [];
    const setQuestions = vi.fn((updater: React.SetStateAction<Question[]>) => {
      if (typeof updater === 'function') {
        const prev = allUpdates.length ? allUpdates[allUpdates.length - 1]! : questions;
        const next = updater(prev);
        allUpdates.push(next);
      }
    });

    const { result } = renderHook(() => usePlusOne(setQuestions), { wrapper });
    await act(async () => {
      await result.current.vote('q-1');
    });

    // Should have been called twice: optimistic + rollback
    expect(setQuestions).toHaveBeenCalledTimes(2);

    // Optimistic update
    expect(allUpdates[0]![0]!.plusOneCount).toBe(6);
    expect(allUpdates[0]![0]!.state).toBe('voted');

    // Rollback
    expect(allUpdates[1]![0]!.plusOneCount).toBe(5);
    expect(allUpdates[1]![0]!.state).toBe('default');
  });

  it('re-sorts after rollback', async () => {
    mockService.voteQuestion = vi.fn().mockRejectedValue(new Error('fail'));

    const questions: Question[] = [
      buildQuestion({ id: 'q-a', plusOneCount: 10 }),
      buildQuestion({ id: 'q-b', plusOneCount: 9 }),
    ];
    const allUpdates: Question[][] = [];
    const setQuestions = vi.fn((updater: React.SetStateAction<Question[]>) => {
      if (typeof updater === 'function') {
        const prev = allUpdates.length ? allUpdates[allUpdates.length - 1]! : questions;
        const next = updater(prev);
        allUpdates.push(next);
      }
    });

    const { result } = renderHook(() => usePlusOne(setQuestions), { wrapper });
    await act(async () => {
      await result.current.vote('q-b');
    });

    // After rollback, q-b should be back to 9, sorted after q-a (10)
    const rollback = allUpdates[1]!;
    expect(rollback[0]!.id).toBe('q-a');
    expect(rollback[1]!.id).toBe('q-b');
    expect(rollback[1]!.plusOneCount).toBe(9);
  });
});
