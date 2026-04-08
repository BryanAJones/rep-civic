import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useMyBallot } from '../../hooks/useMyBallot';
import { BallotCard } from '../../components/candidate/BallotCard';
import { service } from '../../services';
import type { District } from '../../types/domain';
import './OnboardingPage.css';

const CTA_THRESHOLD = 6;
const CASCADE_DELAY_MS = 120;

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-card__avatar skeleton-shimmer" />
      <div className="skeleton-card__lines">
        <div className="skeleton-card__line skeleton-card__line--long skeleton-shimmer" />
        <div className="skeleton-card__line skeleton-card__line--short skeleton-shimmer" />
      </div>
    </div>
  );
}

function buildCounterLabel(total: number): string {
  return total === 1
    ? 'state and federal candidate on your ballot'
    : 'state and federal candidates on your ballot';
}

export function OnboardingPage() {
  const [address, setAddress] = useState('');
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [phase, setPhase] = useState<'input' | 'cascade'>('input');
  const { dispatch } = useUser();
  const navigate = useNavigate();

  const { groups, totalCandidates, loading: ballotLoading } = useMyBallot(districts);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim()) return;

    setResolving(true);
    setError(null);
    try {
      const result = await service.resolveDistricts(address.trim());
      dispatch({ type: 'COMPLETE_ONBOARDING', districts: result });
      setDistricts(result);
      setPhase('cascade');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve districts');
    } finally {
      setResolving(false);
    }
  }

  function handleCta() {
    navigate('/app/feed', { replace: true });
  }

  // Count total cards rendered so far (for stagger delay + CTA threshold)
  let cardIndex = 0;

  return (
    <div className="onboarding">
      <div className="onboarding__hero">
        <div className="onboarding__logo">
          Rep<span className="onboarding__period">.</span>
        </div>
        <div className="onboarding__tagline">Civic accountability platform</div>
        <p className="onboarding__desc">
          Every person who represents you, in one place.
        </p>
      </div>

      {phase === 'input' && (
        <form className="onboarding__body" onSubmit={handleSubmit}>
          <label className="onboarding__label" htmlFor="address-input">
            Home address
          </label>
          <input
            id="address-input"
            className="onboarding__input"
            type="text"
            placeholder="123 Main St, Atlanta, GA 30315"
            value={address}
            maxLength={200}
            onChange={(e) => setAddress(e.target.value)}
            disabled={resolving}
          />

          {error && <p className="onboarding__error">{error}</p>}

          <button
            type="submit"
            className="onboarding__submit"
            disabled={resolving || !address.trim()}
          >
            {resolving ? 'Finding representatives...' : 'Find my representatives'}
          </button>

          <p className="onboarding__fine">
            Your address is used only to determine your voting districts.
            It is not stored or shared.
          </p>
        </form>
      )}

      {phase === 'cascade' && ballotLoading && (
        <div className="onboarding__cascade" data-testid="cascade-skeleton">
          <div className="onboarding__card-list">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      )}

      {phase === 'cascade' && !ballotLoading && groups.length > 0 && (
        <div className="onboarding__cascade" data-testid="cascade-reveal">
          <div className="onboarding__counter counter-reveal">
            <div className="onboarding__counter-number">{totalCandidates}</div>
            <div className="onboarding__counter-label">
              {buildCounterLabel(totalCandidates)}
            </div>
          </div>

          {groups.map((group) => (
            <div key={group.level}>
              <div className="onboarding__group-header cascade-card" style={{ animationDelay: `${cardIndex++ * CASCADE_DELAY_MS}ms` }}>
                {group.label}
              </div>
              <div className="onboarding__card-list">
                {group.candidates.map((candidate) => {
                  const delay = cardIndex++ * CASCADE_DELAY_MS;
                  return (
                    <BallotCard
                      key={candidate.id}
                      candidate={candidate}
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {totalCandidates >= CTA_THRESHOLD && (
            <div className="onboarding__cta-bar fade-in" style={{ animationDelay: `${CTA_THRESHOLD * CASCADE_DELAY_MS + 300}ms` }}>
              <button
                type="button"
                className="onboarding__cta-button"
                onClick={handleCta}
              >
                See what they are saying
              </button>
            </div>
          )}

          {totalCandidates > 0 && totalCandidates < CTA_THRESHOLD && (
            <div className="onboarding__cta-bar fade-in" style={{ animationDelay: `${totalCandidates * CASCADE_DELAY_MS + 300}ms` }}>
              <button
                type="button"
                className="onboarding__cta-button"
                onClick={handleCta}
              >
                See what they are saying
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
