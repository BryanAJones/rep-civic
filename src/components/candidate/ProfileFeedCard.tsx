import { useNavigate } from 'react-router-dom';
import { Avatar, StatusPill, MonoText, PlusOneButton } from '../primitives';
import { QuestionInput } from '../questions';
import type { Candidate, Question, QuestionId } from '../../types/domain';
import './ProfileFeedCard.css';

interface ProfileFeedCardProps {
  candidate: Candidate;
  topQuestions: Question[];
  onVote: (questionId: QuestionId) => void;
  onSubmitQuestion: (text: string) => void;
}

export function ProfileFeedCard({
  candidate,
  topQuestions,
  onVote,
  onSubmitQuestion,
}: ProfileFeedCardProps) {
  const navigate = useNavigate();
  const variant = candidate.status === 'unclaimed' ? 'unclaimed' : 'claimed';

  return (
    <article className="profile-feed-card">
      <button
        type="button"
        className="profile-feed-card__head"
        onClick={() => navigate(`/app/profile/${candidate.id}`)}
      >
        <Avatar initials={candidate.initials} variant={variant} size={44} />
        <div className="profile-feed-card__head-body">
          <div className="profile-feed-card__name">{candidate.name}</div>
          <div className="profile-feed-card__office">{candidate.officeTitle}</div>
          <div className="profile-feed-card__meta">
            <StatusPill variant={variant} />
            <MonoText size={10} opacity={0.5}>{candidate.party}</MonoText>
          </div>
        </div>
      </button>

      {topQuestions.length > 0 && (
        <ul className="profile-feed-card__questions">
          {topQuestions.map((q) => (
            <li key={q.id} className="profile-feed-card__question">
              <p className="profile-feed-card__question-text">{q.text}</p>
              <PlusOneButton
                state={q.state}
                count={q.plusOneCount}
                onVote={() => onVote(q.id)}
              />
            </li>
          ))}
        </ul>
      )}

      <div className="profile-feed-card__ask">
        <QuestionInput
          placeholder={`Ask ${candidate.name} a question...`}
          onSubmit={onSubmitQuestion}
        />
      </div>
    </article>
  );
}
