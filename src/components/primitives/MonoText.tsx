import type { ReactNode } from 'react';
import './MonoText.css';

interface MonoTextProps {
  children: ReactNode;
  size?: number;
  opacity?: number;
  color?: string;
}

export function MonoText({ children, size = 12, opacity = 1, color }: MonoTextProps) {
  return (
    <span
      className="mono-text"
      style={{ fontSize: size, opacity, color }}
    >
      {children}
    </span>
  );
}
