import { useState } from 'react';
import { sendMagicLink } from '../../services/authService';
import { clearPendingIntent } from '../../utils/pendingIntent';
import './EmailGateModal.css';

interface EmailGateModalProps {
  message: string;
  onClose: () => void;
}

export function EmailGateModal({ message, onClose }: EmailGateModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    const trimmed = email.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    const { error: err } = await sendMagicLink(trimmed);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    setSent(true);
  }

  function handleCancel() {
    // User backed out — drop the pending intent so it doesn't surprise them later
    clearPendingIntent();
    onClose();
  }

  return (
    <div className="email-gate-backdrop" onClick={handleCancel}>
      <div className="email-gate-modal" onClick={(e) => e.stopPropagation()}>
        <div className="email-gate-modal__header">
          <span className="email-gate-modal__title">Verify your email</span>
          <button className="email-gate-modal__close" type="button" onClick={handleCancel} aria-label="Close">
            &times;
          </button>
        </div>

        {sent ? (
          <>
            <p className="email-gate-modal__text">
              Check your email for a sign-in link. When you return, your action will resume automatically.
            </p>
            <button className="email-gate-modal__btn" type="button" onClick={onClose}>
              Done
            </button>
          </>
        ) : (
          <>
            <p className="email-gate-modal__text">{message}</p>
            <p className="email-gate-modal__sub">
              Your votes and questions stay tied to your account across devices.
            </p>
            <input
              type="email"
              className="email-gate-modal__input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
              autoComplete="email"
              inputMode="email"
            />
            {error && <p className="email-gate-modal__error">{error}</p>}
            <button
              className="email-gate-modal__btn"
              type="button"
              onClick={handleSend}
              disabled={loading || !email.trim()}
            >
              {loading ? 'Sending' : 'Send sign-in link'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
