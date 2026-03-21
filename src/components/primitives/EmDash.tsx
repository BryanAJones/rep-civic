interface EmDashProps {
  color?: string;
}

export function EmDash({ color = 'var(--rep-steel)' }: EmDashProps) {
  return (
    <span style={{ color, fontFamily: 'var(--rep-font-mono)' }}>
      {'\u2014'}
    </span>
  );
}
