import './Logotype.css';

interface LogotypeProps {
  size?: number;
  onDark?: boolean;
}

export function Logotype({ size = 32, onDark = false }: LogotypeProps) {
  return (
    <span
      className={`logotype ${onDark ? 'logotype--on-dark' : 'logotype--on-light'}`}
      style={{ fontSize: size }}
    >
      Rep<span className="logotype__period">.</span>
    </span>
  );
}
