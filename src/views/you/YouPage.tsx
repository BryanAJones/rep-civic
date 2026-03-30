import { useState } from 'react';
import { useUser } from '../../context/UserContext';
import { FeedbackModal } from '../../components/feedback';
import './YouPage.css';

export function YouPage() {
  const { state } = useUser();
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <div className="you-page">
      {/* Districts */}
      <div className="you-page__section">
        <div className="you-page__section-label">Your districts</div>
        <div className="you-page__card">
          {state.districts.length > 0 ? (
            state.districts.map((d) => (
              <div key={d.code} className="you-page__district">
                <span className="you-page__district-name">{d.districtName}</span>
                <span className="you-page__district-code">{d.code}</span>
              </div>
            ))
          ) : (
            <p className="you-page__placeholder">No districts loaded.</p>
          )}
        </div>
      </div>

      {/* Account */}
      <div className="you-page__section">
        <div className="you-page__section-label">Account</div>
        <div className="you-page__card">
          <div className="you-page__field">
            <span className="you-page__field-label">Handle</span>
            <span className="you-page__field-value">{'\u2014'}</span>
          </div>
          <div className="you-page__field">
            <span className="you-page__field-label">Email</span>
            <span className="you-page__field-value">{'\u2014'}</span>
          </div>
          <div className="you-page__field">
            <span className="you-page__field-label">Status</span>
            <span className="you-page__field-value">Anonymous (pre-auth)</span>
          </div>
          <p className="you-page__placeholder" style={{ marginTop: 'var(--rep-space-md)' }}>
            Account settings will be available when authentication is implemented.
          </p>
        </div>
      </div>

      {/* Feedback */}
      <div className="you-page__section">
        <button
          className="you-page__feedback-btn"
          type="button"
          onClick={() => setShowFeedback(true)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
          </svg>
          Send feedback
        </button>
      </div>

      {showFeedback && (
        <FeedbackModal
          page="/app/you"
          onClose={() => setShowFeedback(false)}
        />
      )}
    </div>
  );
}
