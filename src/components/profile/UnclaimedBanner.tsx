import './UnclaimedBanner.css';

interface UnclaimedBannerProps {
  onClaim?: () => void;
}

export function UnclaimedBanner({ onClaim }: UnclaimedBannerProps) {
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
        >
          Is this you? Claim this profile
        </button>
      )}
    </div>
  );
}
