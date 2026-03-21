import './Avatar.css';

interface AvatarProps {
  initials: string;
  variant: 'unclaimed' | 'claimed';
  size?: number;
}

export function Avatar({ initials, variant, size = 46 }: AvatarProps) {
  return (
    <div
      className={`avatar avatar--${variant}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.33,
      }}
    >
      {initials}
    </div>
  );
}
