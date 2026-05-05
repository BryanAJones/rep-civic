import { useCallback } from 'react';
import { ProfileFeedCard } from '../../components/candidate';
import { useUser } from '../../context/UserContext';
import { service } from '../../services';
import type { CandidateId, QuestionId } from '../../types/domain';
import { useProfileFeed } from '../../hooks/useProfileFeed';
import { useEmailGate } from '../../components/auth';
import { EmailRequiredError } from '../../utils/errors';
import './ProfileFeedPanel.css';

interface ProfileFeedPanelProps {
  districtCodes: string[];
}

export function ProfileFeedPanel({ districtCodes }: ProfileFeedPanelProps) {
  const { state, dispatch } = useUser();
  const { requireEmail } = useEmailGate();
  const { entries, loading, error, updateQuestion, addQuestion } = useProfileFeed(districtCodes);

  const vote = useCallback(async (candidateId: CandidateId, questionId: QuestionId) => {
    if (state.votedQuestionIds.has(questionId)) return;

    dispatch({ type: 'VOTE_QUESTION', questionId });
    updateQuestion(candidateId, (qs) =>
      qs
        .map((q) => q.id === questionId
          ? { ...q, plusOneCount: q.plusOneCount + 1, state: 'voted' as const }
          : q)
        .sort((a, b) => b.plusOneCount - a.plusOneCount));

    try {
      await service.voteQuestion(questionId);
    } catch (err) {
      dispatch({ type: 'UNVOTE_QUESTION', questionId });
      updateQuestion(candidateId, (qs) =>
        qs
          .map((q) => q.id === questionId
            ? { ...q, plusOneCount: q.plusOneCount - 1, state: 'default' as const }
            : q)
          .sort((a, b) => b.plusOneCount - a.plusOneCount));
      if (err instanceof EmailRequiredError) {
        requireEmail({ intent: { type: 'vote', questionId }, message: err.message });
      }
    }
  }, [state.votedQuestionIds, dispatch, updateQuestion, requireEmail]);

  const submit = useCallback(async (candidateId: CandidateId, text: string) => {
    try {
      const q = await service.submitQuestion(candidateId, null, text);
      addQuestion(candidateId, q);
    } catch (err) {
      if (err instanceof EmailRequiredError) {
        requireEmail({
          intent: { type: 'submit-question', candidateId, videoId: null, topicId: null, text },
          message: err.message,
        });
      }
      // Other errors silently swallowed — inline error UI is a follow-on iteration.
    }
  }, [addQuestion, requireEmail]);

  if (loading) {
    return (
      <div className="profile-feed-panel">
        <div className="profile-feed-panel__status">Loading candidates...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-feed-panel">
        <div className="profile-feed-panel__status">{error}</div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="profile-feed-panel">
        <div className="profile-feed-panel__status">No candidates at this level yet.</div>
      </div>
    );
  }

  return (
    <div className="profile-feed-panel">
      <div className="profile-feed-panel__list">
        {entries.map(({ candidate, topQuestions }) => (
          <ProfileFeedCard
            key={candidate.id}
            candidate={candidate}
            topQuestions={topQuestions}
            onVote={(questionId) => vote(candidate.id, questionId)}
            onSubmitQuestion={(text) => submit(candidate.id, text)}
          />
        ))}
      </div>
    </div>
  );
}
