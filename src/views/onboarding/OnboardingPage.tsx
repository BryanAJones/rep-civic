import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useMyBallot } from '../../hooks/useMyBallot';
import { BallotCard } from '../../components/candidate/BallotCard';
import { service } from '../../services';
import { STATE_NAMES } from '../../utils/stateNames';
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
  const [pendingDistricts, setPendingDistricts] = useState<District[]>([]);
  const [resolvedState, setResolvedState] = useState<string | null>(null);
  const [phase, setPhase] = useState<'input' | 'resolving' | 'confirm' | 'cascade'>('input');
  const { dispatch } = useUser();
  const navigate = useNavigate();

  const { groups, totalCandidates, loading: ballotLoading, error: ballotError } = useMyBallot(districts);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim()) return;

    setResolving(true);
    setError(null);
    setPhase('resolving');
    try {
      const result = await service.resolveDistricts(address.trim());
      // Extract state abbreviation from first district code (e.g. STATE:GA-CD:5 → GA)
      const firstCode = result[0]?.code ?? '';
      const stMatch = firstCode.match(/^STATE:([A-Z]{2})/);
      const st = stMatch?.[1] ?? null;
      setResolvedState(st);
      setPendingDistricts(result);
      setPhase('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve districts');
      setPhase('input');
    } finally {
      setResolving(false);
    }
  }

  function handleConfirm() {
    dispatch({ type: 'COMPLETE_ONBOARDING', districts: pendingDistricts });
    setDistricts(pendingDistricts);
    setPhase('cascade');
  }

  function handleRetry() {
    setPendingDistricts([]);
    setResolvedState(null);
    setPhase('input');
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
            autoComplete="street-address"
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

      {phase === 'resolving' && (
        <div className="onboarding__cascade" data-testid="resolving-skeleton">
          <p className="onboarding__resolving-label">Finding your representatives…</p>
          <div className="onboarding__card-list">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      )}

      {phase === 'confirm' && resolvedState && resolvedState !== 'GA' && (
        <div className="onboarding__confirm">
          <p className="onboarding__confirm-text">
            Rep currently covers <strong>Georgia</strong> only.
            Your address resolved to <strong>{STATE_NAMES[resolvedState] ?? resolvedState}</strong>.
          </p>
          <p className="onboarding__confirm-subtext">
            More states are coming soon. For now, enter a Georgia address to explore the app.
          </p>
          <button
            type="button"
            className="onboarding__submit"
            onClick={handleRetry}
          >
            Try a different address
          </button>
        </div>
      )}

      {phase === 'confirm' && !resolvedState && (
        <div className="onboarding__confirm">
          <p className="onboarding__confirm-text">
            We could not determine districts for that address.
          </p>
          <button
            type="button"
            className="onboarding__submit"
            onClick={handleRetry}
          >
            Try a different address
          </button>
        </div>
      )}

      {phase === 'confirm' && resolvedState === 'GA' && (
        <div className="onboarding__confirm">
          <p className="onboarding__confirm-text">
            We found your districts in <strong>Georgia</strong>.
          </p>
          <div className="onboarding__confirm-actions">
            <button
              type="button"
              className="onboarding__submit"
              onClick={handleConfirm}
            >
              That is correct
            </button>
            <button
              type="button"
              className="onboarding__retry-btn"
              onClick={handleRetry}
            >
              Not right, try again
            </button>
          </div>
        </div>
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

      {phase === 'cascade' && !ballotLoading && (ballotError || groups.length === 0) && (
        <div className="onboarding__cascade">
          <p className="onboarding__error">
            {ballotError ?? 'No candidates found for this address.'}
          </p>
          <button
            type="button"
            className="onboarding__submit"
            onClick={() => { setPhase('input'); setDistricts([]); }}
          >
            Try a different address
          </button>
        </div>
      )}

      {phase === 'cascade' && !ballotLoading && !ballotError && groups.length > 0 && (
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

          {totalCandidates > 0 && (
            <div
              className="onboarding__cta-bar fade-in"
              style={{ animationDelay: `${Math.min(totalCandidates, CTA_THRESHOLD) * CASCADE_DELAY_MS + 300}ms` }}
            >
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
