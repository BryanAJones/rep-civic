import { useNavigate } from 'react-router-dom';
import { Avatar, StatusPill, MonoText } from '../primitives';
import type { Candidate } from '../../types/domain';
import './CandidateCard.css';

interface CandidateCardProps {
  candidate: Candidate;
}

export function CandidateCard({ candidate }: CandidateCardProps) {
  const navigate = useNavigate();
  const variant = candidate.status === 'unclaimed' ? 'unclaimed' : 'claimed';

  return (
    <button
      type="button"
      className="candidate-card"
      onClick={() => navigate(`/app/profile/${candidate.id}`)}
    >
      <Avatar initials={candidate.initials} variant={variant} size={44} />
      <div className="candidate-card__body">
        <div className="candidate-card__name">{candidate.name}</div>
        <div className="candidate-card__office">{candidate.officeTitle}</div>
        <div className="candidate-card__meta">
          <StatusPill variant={candidate.status === 'unclaimed' ? 'unclaimed' : 'claimed'} />
          <MonoText size={10} opacity={0.5}>{candidate.party}</MonoText>
        </div>
      </div>
    </button>
  );
}
