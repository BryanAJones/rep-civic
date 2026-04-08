import { CandidateCard } from '../../components/candidate';
import type { Candidate } from '../../types/domain';
import './CandidatePanel.css';

interface CandidatePanelProps {
  candidates: Candidate[];
  loading: boolean;
  error: string | null;
  scrollRef: (el: HTMLDivElement | null) => void;
}

export function CandidatePanel({ candidates, loading, error, scrollRef }: CandidatePanelProps) {
  if (loading) {
    return (
      <div className="candidate-panel">
        <div className="candidate-panel__status">Loading candidates...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="candidate-panel">
        <div className="candidate-panel__status">{error}</div>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="candidate-panel">
        <div className="candidate-panel__status">No candidates at this level yet.</div>
      </div>
    );
  }

  return (
    <div className="candidate-panel" ref={scrollRef}>
      <div className="candidate-panel__list">
        {candidates.map((c) => (
          <CandidateCard key={c.id} candidate={c} />
        ))}
      </div>
    </div>
  );
}
