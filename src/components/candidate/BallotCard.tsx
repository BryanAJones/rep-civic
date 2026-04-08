import { Avatar } from '../primitives';
import type { Candidate } from '../../types/domain';
import './BallotCard.css';

interface BallotCardProps {
  candidate: Candidate;
  style?: React.CSSProperties;
}

export function BallotCard({ candidate, style }: BallotCardProps) {
  const variant = candidate.status === 'unclaimed' ? 'unclaimed' : 'claimed';

  return (
    <div className="ballot-card cascade-card" style={style}>
      <Avatar initials={candidate.initials} variant={variant} size={36} />
      <div className="ballot-card__info">
        <div className="ballot-card__name">{candidate.name}</div>
        <div className="ballot-card__office">{candidate.officeTitle}</div>
        <div className="ballot-card__party">{candidate.party}</div>
      </div>
    </div>
  );
}
