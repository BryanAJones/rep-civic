import { useCallback } from 'react';
import type { Question, QuestionId } from '../types/domain';
import { useUser } from '../context/UserContext';
import { service } from '../services';
import { useEmailGate } from '../components/auth';
import { EmailRequiredError } from '../utils/errors';

export function usePlusOne(
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>,
) {
  const { state, dispatch } = useUser();
  const { requireEmail } = useEmailGate();

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

    function rollback() {
      dispatch({ type: 'UNVOTE_QUESTION', questionId });
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

    try {
      await service.voteQuestion(questionId);
    } catch (err) {
      rollback();
      if (err instanceof EmailRequiredError) {
        requireEmail({
          intent: { type: 'vote', questionId },
          message: err.message,
        });
      }
    }
  }, [state.votedQuestionIds, dispatch, setQuestions, requireEmail]);

  return { vote };
}
