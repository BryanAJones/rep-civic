import { useRegisterSW } from 'virtual:pwa-register/react';
import './UpdatePrompt.css';

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.error('Service worker registration failed:', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="update-prompt" role="status" aria-live="polite">
      <div className="update-prompt__copy">
        <div className="update-prompt__title">New version available</div>
        <div className="update-prompt__body">
          Reload to get the latest Rep.
        </div>
      </div>
      <div className="update-prompt__actions">
        <button
          type="button"
          className="update-prompt__button update-prompt__button--primary"
          onClick={() => updateServiceWorker(true)}
        >
          Reload
        </button>
        <button
          type="button"
          className="update-prompt__button"
          onClick={() => setNeedRefresh(false)}
        >
          Later
        </button>
      </div>
    </div>
  );
}
