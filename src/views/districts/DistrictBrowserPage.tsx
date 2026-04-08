import { useState } from 'react';
import { useUser } from '../../context/UserContext';
import { useCandidateFeed } from '../../hooks/useCandidateFeed';
import { CandidateCard } from '../../components/candidate';
import { MonoText } from '../../components/primitives';
import type { District } from '../../types/domain';
import './DistrictBrowserPage.css';

export function DistrictBrowserPage() {
  const { state } = useUser();
  const { districts } = state;

  if (districts.length === 0) {
    return (
      <div className="district-browser">
        <div className="district-browser__empty">
          No districts found. Complete onboarding to see your representatives.
        </div>
      </div>
    );
  }

  return (
    <div className="district-browser">
      <div className="district-browser__header">
        <h1 className="district-browser__title">Your Districts</h1>
        <MonoText size={11} opacity={0.6}>
          {districts.length} district{districts.length !== 1 ? 's' : ''}
        </MonoText>
      </div>
      <div className="district-browser__list">
        {districts.map((district) => (
          <DistrictSection key={district.code} district={district} />
        ))}
      </div>
    </div>
  );
}

function DistrictSection({ district }: { district: District }) {
  const [expanded, setExpanded] = useState(true);
  const { candidates, loading } = useCandidateFeed([district.code]);

  return (
    <section className="district-section">
      <button
        type="button"
        className="district-section__header"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <div className="district-section__info">
          <span className="district-section__office">{district.officeTitle}</span>
          <span className="district-section__name">{district.districtName}</span>
        </div>
        <div className="district-section__meta">
          <MonoText size={10} opacity={0.5}>
            {loading ? '...' : `${candidates.length}`}
          </MonoText>
          <span className={`district-section__chevron ${expanded ? 'district-section__chevron--open' : ''}`}>
            {'\u25B8'}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="district-section__candidates">
          {loading && (
            <div className="district-section__loading">Loading...</div>
          )}
          {!loading && candidates.length === 0 && (
            <div className="district-section__empty">No candidates on file.</div>
          )}
          {!loading && candidates.map((c) => (
            <CandidateCard key={c.id} candidate={c} />
          ))}
        </div>
      )}
    </section>
  );
}
