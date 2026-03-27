import type { Candidate } from '../../types/domain';
import { Avatar, StatusPill, MonoText } from '../primitives';
import './ProfileHeader.css';

interface ProfileHeaderProps {
  candidate: Candidate;
}

export function ProfileHeader({ candidate }: ProfileHeaderProps) {
  const variant = candidate.status === 'unclaimed' ? 'unclaimed' : 'claimed';

  return (
    <div className="profile-header">
      <Avatar initials={candidate.initials} variant={variant} />
      <div className="profile-header__info">
        <h1 className="profile-header__name">{candidate.name}</h1>
        <p className="profile-header__office">
          {candidate.officeTitle} · {candidate.districtCode}
        </p>
        <div className="profile-header__meta">
          <MonoText size={9} opacity={0.5}>{candidate.party}</MonoText>
          <StatusPill variant={variant} />
        </div>
      </div>
    </div>
  );
}
