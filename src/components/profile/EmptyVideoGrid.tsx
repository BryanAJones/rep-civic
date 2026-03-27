import './EmptyVideoGrid.css';

interface EmptyVideoGridProps {
  candidateName: string;
  questionCount: number;
}

export function EmptyVideoGrid({ candidateName, questionCount }: EmptyVideoGridProps) {
  return (
    <div className="empty-video-grid">
      <div className="empty-video-grid__cells">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="empty-video-grid__cell">
            <span className="empty-video-grid__plus">+</span>
          </div>
        ))}
      </div>
      <p className="empty-video-grid__prompt">
        No videos posted yet. {candidateName} has joined Rep. but hasn't posted
        a video. {questionCount} questions are waiting for a reply.
      </p>
    </div>
  );
}
