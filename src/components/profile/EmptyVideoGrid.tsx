import { MonoText } from '../primitives';
import './EmptyVideoGrid.css';

interface EmptyVideoGridProps {
  candidateName: string;
  questionCount: number;
}

// Calm-dossier empty state for claimed candidates with no posted videos.
// Silence is reported as fact, not as failure: declarative copy, mono
// counts, em-dash where appropriate. The grid of placeholder cells is
// kept (visual rhythm with the populated state) but the prompt copy is
// trimmed to two short sentences.
export function EmptyVideoGrid({ candidateName, questionCount }: EmptyVideoGridProps) {
  return (
    <div className="empty-video-grid">
      <div className="empty-video-grid__cells">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="empty-video-grid__cell" />
        ))}
      </div>
      <p className="empty-video-grid__prompt">
        {candidateName} has not posted any videos.{' '}
        <MonoText size={12}>{questionCount}</MonoText>{' '}
        constituent question{questionCount === 1 ? '' : 's'} pending.
      </p>
    </div>
  );
}
