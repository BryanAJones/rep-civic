import { useState } from 'react';
import { useUser } from '../../context/UserContext';
import { sendMagicLink, updateHandle } from '../../services/authService';
import { FeedbackModal } from '../../components/feedback';
import './YouPage.css';

export function YouPage() {
  const { state, dispatch } = useUser();
  const [showFeedback, setShowFeedback] = useState(false);

  // Magic link upgrade
  const [emailInput, setEmailInput] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Handle editing
  const [editingHandle, setEditingHandle] = useState(false);
  const [handleInput, setHandleInput] = useState('');
  const [handleError, setHandleError] = useState<string | null>(null);
  const [handleLoading, setHandleLoading] = useState(false);

  async function handleMagicLink() {
    if (!emailInput.trim()) return;
    setAuthLoading(true);
    setAuthError(null);
    const { error } = await sendMagicLink(emailInput.trim());
    setAuthLoading(false);
    if (error) {
      setAuthError(error);
    } else {
      setMagicLinkSent(true);
    }
  }

  async function handleSaveHandle() {
    if (!handleInput.trim()) return;
    setHandleLoading(true);
    setHandleError(null);
    const { error } = await updateHandle(handleInput.trim());
    setHandleLoading(false);
    if (error) {
      setHandleError(error);
    } else {
      dispatch({ type: 'HANDLE_UPDATED', handle: handleInput.trim() });
      setEditingHandle(false);
    }
  }

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
            {editingHandle ? (
              <div className="you-page__handle-edit">
                <input
                  type="text"
                  className="you-page__handle-input"
                  value={handleInput}
                  onChange={(e) => setHandleInput(e.target.value)}
                  placeholder="@your_handle"
                  maxLength={20}
                />
                <button
                  type="button"
                  className="you-page__handle-save"
                  onClick={handleSaveHandle}
                  disabled={handleLoading}
                >
                  {handleLoading ? 'Saving' : 'Save'}
                </button>
                <button
                  type="button"
                  className="you-page__handle-cancel"
                  onClick={() => { setEditingHandle(false); setHandleError(null); }}
                >
                  Cancel
                </button>
                {handleError && <p className="you-page__error">{handleError}</p>}
              </div>
            ) : (
              <span className="you-page__field-value">
                {state.handle ?? '\u2014'}
                {!state.isAnonymous && (
                  <button
                    type="button"
                    className="you-page__edit-btn"
                    onClick={() => { setEditingHandle(true); setHandleInput(state.handle ?? '@'); }}
                  >
                    Edit
                  </button>
                )}
              </span>
            )}
          </div>
          <div className="you-page__field">
            <span className="you-page__field-label">Email</span>
            <span className="you-page__field-value">{state.email ?? '\u2014'}</span>
          </div>
          <div className="you-page__field">
            <span className="you-page__field-label">Status</span>
            <span className="you-page__field-value">
              {state.isAnonymous ? 'Anonymous' : 'Verified'}
            </span>
          </div>

          {/* Magic link upgrade for anonymous users */}
          {state.isAnonymous && state.authReady && (
            <div className="you-page__upgrade">
              {magicLinkSent ? (
                <p className="you-page__upgrade-sent">
                  Check your email for a sign-in link. Your votes and data will be preserved.
                </p>
              ) : (
                <>
                  <p className="you-page__upgrade-text">
                    Verify your email to keep your account across devices, choose a custom handle, and claim candidate profiles.
                  </p>
                  <div className="you-page__upgrade-form">
                    <input
                      type="email"
                      className="you-page__email-input"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="you@example.com"
                      maxLength={254}
                    />
                    <button
                      type="button"
                      className="you-page__upgrade-btn"
                      onClick={handleMagicLink}
                      disabled={authLoading || !emailInput.trim()}
                    >
                      {authLoading ? 'Sending' : 'Send sign-in link'}
                    </button>
                  </div>
                  {authError && <p className="you-page__error">{authError}</p>}
                </>
              )}
            </div>
          )}
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
