import './Tag.css';

type TagVariant = 'blue' | 'gold' | 'navy' | 'mist' | 'green' | 'dark';

interface TagProps {
  label: string;
  variant?: TagVariant;
}

export function Tag({ label, variant = 'blue' }: TagProps) {
  return (
    <span className={`tag tag--${variant}`}>
      {label}
    </span>
  );
}
