import { useCallback } from 'react';
import type { Question, QuestionId } from '../types/domain';
import { useUser } from '../context/UserContext';
import { service } from '../services';

export function usePlusOne(
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>,
) {
  const { state, dispatch } = useUser();

  const vote = useCallback(async (questionId: QuestionId) => {
    // Already voted — no-op
    if (state.votedQuestionIds.has(questionId)) return;

    // Optimistic update
    dispatch({ type: 'VOTE_QUESTION', questionId });
    setQuestions((prev) =>
      prev
        .map((q) =>
          q.id === questionId
            ? { ...q, plusOneCount: q.plusOneCount + 1, state: 'voted' as const }
            : q,
        )
        .sort((a, b) => b.plusOneCount - a.plusOneCount),
    );

    try {
      await service.voteQuestion(questionId);
    } catch {
      // Rollback on error
      setQuestions((prev) =>
        prev
          .map((q) =>
            q.id === questionId
              ? { ...q, plusOneCount: q.plusOneCount - 1, state: 'default' as const }
              : q,
          )
          .sort((a, b) => b.plusOneCount - a.plusOneCount),
      );
    }
  }, [state.votedQuestionIds, dispatch, setQuestions]);

  return { vote };
}
