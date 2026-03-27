import type { Candidate } from '../../types/domain';
import { EmDash, MonoText } from '../primitives';
import './ProfileStats.css';

interface ProfileStatsProps {
  candidate: Candidate;
}

export function ProfileStats({ candidate }: ProfileStatsProps) {
  return (
    <div className="profile-stats">
      <div className="profile-stats__item">
        <span className="profile-stats__value">
          {candidate.status === 'unclaimed' ? (
            <EmDash />
          ) : (
            <MonoText size={14}>{candidate.videoCount}</MonoText>
          )}
        </span>
        <span className="profile-stats__label">Videos</span>
      </div>

      <div className="profile-stats__divider" />

      <div className="profile-stats__item">
        <span className="profile-stats__value">
          {candidate.status === 'active' ? (
            <MonoText size={14}>{candidate.answeredQuestionCount}</MonoText>
          ) : (
            <MonoText size={14}>{candidate.questionCount}</MonoText>
          )}
        </span>
        <span className="profile-stats__label">Questions</span>
      </div>

      <div className="profile-stats__divider" />

      <div className="profile-stats__item">
        <span className="profile-stats__value">
          {candidate.status === 'active' ? (
            <MonoText size={14}>{candidate.responseRate}%</MonoText>
          ) : (
            <EmDash />
          )}
        </span>
        <span className="profile-stats__label">Response rate</span>
      </div>
    </div>
  );
}
