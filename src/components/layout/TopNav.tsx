import { Logotype } from '../primitives';
import './TopNav.css';

interface TopNavProps {
  backLabel?: string;
  onBack?: () => void;
  onFeedback?: () => void;
}

export function TopNav({ backLabel, onBack, onFeedback }: TopNavProps) {
  return (
    <nav className="top-nav">
      {backLabel ? (
        <button className="top-nav__back" onClick={onBack} type="button">
          <span className="top-nav__back-arrow">{'\u2190'}</span>
          {backLabel}
        </button>
      ) : (
        <Logotype size={18} onDark />
      )}
      {onFeedback && (
        <button className="top-nav__feedback" onClick={onFeedback} type="button" aria-label="Send feedback">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
          </svg>
        </button>
      )}
    </nav>
  );
}
