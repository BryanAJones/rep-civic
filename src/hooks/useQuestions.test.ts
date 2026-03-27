import { renderHook, act, waitFor } from '@testing-library/react';
import { createMockService } from '../test/mock-service';
import { buildQuestion } from '../test/mock-data';
import type { Question } from '../types/domain';

const mockService = createMockService();

vi.mock('../services', () => ({
  service: mockService,
}));

const { useQuestions } = await import('./useQuestions');

describe('useQuestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockService.getQuestionsForVideo = vi.fn().mockResolvedValue([]);
  });

  it('fetches questions for a videoId and returns them', async () => {
    const questions = [
      buildQuestion({ id: 'q-1', plusOneCount: 10 }),
      buildQuestion({ id: 'q-2', plusOneCount: 5 }),
    ];
    mockService.getQuestionsForVideo = vi.fn().mockResolvedValue(questions);

    const { result } = renderHook(() => useQuestions('v-1'));
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.questions).toEqual(questions);
    expect(mockService.getQuestionsForVideo).toHaveBeenCalledWith('v-1');
  });

  it('returns empty array and resets when videoId is null', async () => {
    const { result, rerender } = renderHook(
      ({ videoId }: { videoId: string | null }) => useQuestions(videoId),
      { initialProps: { videoId: 'v-1' as string | null } },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    rerender({ videoId: null });
    expect(result.current.questions).toEqual([]);
  });

  it('transitions loading state correctly', async () => {
    let resolve: (value: Question[]) => void;
    mockService.getQuestionsForVideo = vi.fn().mockReturnValue(
      new Promise<Question[]>((r) => { resolve = r; }),
    );

    const { result } = renderHook(() => useQuestions('v-1'));
    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolve!([]);
    });
    expect(result.current.loading).toBe(false);
  });

  it('surfaces error message on failure', async () => {
    mockService.getQuestionsForVideo = vi.fn().mockRejectedValue(
      new Error('Server error'),
    );

    const { result } = renderHook(() => useQuestions('v-1'));
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Server error');
    expect(result.current.questions).toEqual([]);
  });

  it('does not update state with stale data when videoId changes', async () => {
    let firstResolve: (value: Question[]) => void;
    const firstPromise = new Promise<Question[]>((r) => { firstResolve = r; });
    const secondQuestions = [buildQuestion({ id: 'q-second' })];

    mockService.getQuestionsForVideo = vi.fn()
      .mockReturnValueOnce(firstPromise)
      .mockResolvedValueOnce(secondQuestions);

    const { result, rerender } = renderHook(
      ({ videoId }: { videoId: string }) => useQuestions(videoId),
      { initialProps: { videoId: 'v-1' } },
    );

    // Change videoId before first fetch resolves
    rerender({ videoId: 'v-2' });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Now resolve the first (stale) fetch
    await act(async () => {
      firstResolve!([buildQuestion({ id: 'q-stale' })]);
    });

    // Should have the second video's questions, not the stale ones
    expect(result.current.questions).toEqual(secondQuestions);
  });

  it('submitQuestion adds new question and re-sorts', async () => {
    const existing = [
      buildQuestion({ id: 'q-1', plusOneCount: 10 }),
    ];
    mockService.getQuestionsForVideo = vi.fn().mockResolvedValue(existing);
    mockService.submitQuestion = vi.fn().mockResolvedValue(
      buildQuestion({ id: 'q-new', plusOneCount: 0, text: 'New question' }),
    );

    const { result } = renderHook(() => useQuestions('v-1'));
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.submitQuestion('New question');
    });

    expect(result.current.questions).toHaveLength(2);
    // q-1 (10) should be first, q-new (0) second
    expect(result.current.questions[0]!.id).toBe('q-1');
    expect(result.current.questions[1]!.id).toBe('q-new');
  });

  it('submitQuestion with null videoId does nothing', async () => {
    const { result } = renderHook(() => useQuestions(null));

    await act(async () => {
      await result.current.submitQuestion('Test');
    });

    expect(mockService.submitQuestion).not.toHaveBeenCalled();
  });
});
