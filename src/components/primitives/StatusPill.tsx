import './StatusPill.css';

interface StatusPillProps {
  variant: 'unclaimed' | 'claimed';
}

export function StatusPill({ variant }: StatusPillProps) {
  return (
    <span className={`status-pill status-pill--${variant}`}>
      {variant === 'unclaimed' ? '\u26AC Not yet joined' : '\u2713 Active on Rep.'}
    </span>
  );
}
