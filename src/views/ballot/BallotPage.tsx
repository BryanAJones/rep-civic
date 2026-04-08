import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useMyBallot } from '../../hooks/useMyBallot';
import { BallotCard } from '../../components/candidate/BallotCard';
import './BallotPage.css';

export function BallotPage() {
  const { state } = useUser();
  const navigate = useNavigate();
  const { groups, totalCandidates, loading, error } = useMyBallot(state.districts);
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const text = `I have ${totalCandidates} state and federal candidates on my ballot. Find yours at getrep.org`;
    if (navigator.share) {
      try {
        await navigator.share({ text, url: 'https://getrep.org' });
      } catch {
        // User cancelled share
      }
      return;
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="ballot-page">
        <div className="ballot-page__status">Loading your ballot...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ballot-page">
        <div className="ballot-page__status">{error}</div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="ballot-page">
        <div className="ballot-page__status">No candidates found for your districts.</div>
      </div>
    );
  }

  return (
    <div className="ballot-page">
      <div className="ballot-page__header">
        <div>
          <h1 className="ballot-page__title">Your Ballot</h1>
          <span className="ballot-page__count">
            {totalCandidates} candidate{totalCandidates !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          type="button"
          className="ballot-page__share"
          onClick={handleShare}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
          </svg>
          {copied ? 'Copied' : 'Share'}
        </button>
      </div>

      {groups.map((group) => (
        <div key={group.level} className="ballot-page__group">
          <div className="ballot-page__group-header">{group.label}</div>
          <div className="ballot-page__card-list">
            {group.candidates.map((candidate) => (
              <button
                key={candidate.id}
                type="button"
                className="ballot-page__card-btn"
                onClick={() => navigate(`/app/profile/${candidate.id}`)}
              >
                <BallotCard candidate={candidate} />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
