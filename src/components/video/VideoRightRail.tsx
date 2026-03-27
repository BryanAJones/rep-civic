import './VideoRightRail.css';

interface VideoRightRailProps {
  reactionCount: number;
  questionCount: number;
  onQuestionsPress?: () => void;
}

export function VideoRightRail({ reactionCount, questionCount, onQuestionsPress }: VideoRightRailProps) {
  return (
    <div className="right-rail">
      {/* Reactions */}
      <div className="right-rail__item">
        <button className="right-rail__btn" type="button" aria-label="React">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>
        <span className="right-rail__count">{reactionCount}</span>
      </div>

      {/* Questions */}
      <div className="right-rail__item">
        <button className="right-rail__btn" type="button" onClick={onQuestionsPress} aria-label="Questions">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
          </svg>
        </button>
        <span className="right-rail__count">{questionCount}</span>
      </div>

      {/* Share */}
      <div className="right-rail__item">
        <button className="right-rail__btn" type="button" aria-label="Share">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
          </svg>
        </button>
      </div>

      {/* Respond (gold) */}
      <div className="right-rail__item">
        <button className="right-rail__btn right-rail__btn--gold" type="button" aria-label="Respond">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
