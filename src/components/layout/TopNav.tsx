import { Logotype } from '../primitives';
import './TopNav.css';

interface TopNavProps {
  contextString?: string;
  backLabel?: string;
  onBack?: () => void;
}

export function TopNav({ contextString, backLabel, onBack }: TopNavProps) {
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
      {contextString && (
        <span className="top-nav__context">{contextString}</span>
      )}
    </nav>
  );
}
