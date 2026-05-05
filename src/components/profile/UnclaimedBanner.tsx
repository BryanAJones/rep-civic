import './UnclaimedBanner.css';

interface UnclaimedBannerProps {
  onClaim?: () => void;
  claiming?: boolean;
}

export function UnclaimedBanner({ onClaim, claiming = false }: UnclaimedBannerProps) {
  return (
    <div className="unclaimed-banner">
      <p className="unclaimed-banner__text">
        This candidate hasn't joined yet. Their profile is built from public
        records. Leave a question — they'll be notified.
      </p>
      {onClaim && (
        <button
          type="button"
          className="unclaimed-banner__claim"
          onClick={onClaim}
          disabled={claiming}
        >
          {claiming ? 'Claiming' : 'Is this you? Claim this profile'}
        </button>
      )}
    </div>
  );
}
