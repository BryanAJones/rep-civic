import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { service } from '../../services';
import { useUser } from '../../context/UserContext';
import './ClaimFinalizePage.css';

type State =
  | { kind: 'waiting' }
  | { kind: 'done'; candidateName: string }
  | { kind: 'expired' }
  | { kind: 'error'; message: string };

// Magic-link landing page for the verify-candidate-claim flow.
//
// The candidate clicks the link in their FEC-on-file inbox. Supabase
// auto-signs them in as that email, then redirects here. We wait for
// the AUTH_UPGRADED event to settle, call finalize, and route to the
// dashboard on success.
export function ClaimFinalizePage() {
  const navigate = useNavigate();
  const { state: userState } = useUser();
  const [state, setState] = useState<State>({ kind: 'waiting' });
  const startedRef = useRef(false);

  useEffect(() => {
    if (!userState.authReady || userState.isAnonymous) return;
    if (startedRef.current) return;
    startedRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        const result = await service.finalizeCandidateClaim();
        if (cancelled) return;
        if (!result) {
          setState({ kind: 'expired' });
          return;
        }
        setState({ kind: 'done', candidateName: result.candidateName });
        setTimeout(() => navigate('/app/dashboard'), 1200);
      } catch (err) {
        if (cancelled) return;
        setState({
          kind: 'error',
          message: err instanceof Error ? err.message : 'Could not finalize claim',
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userState.authReady, userState.isAnonymous, navigate]);

  return (
    <div className="claim-finalize">
      <div className="claim-finalize__panel">
        <span className="claim-finalize__label">Finalizing claim</span>
        {state.kind === 'waiting' && (
          <p className="claim-finalize__text">
            {userState.authReady && !userState.isAnonymous
              ? 'Verifying with public records…'
              : 'Waiting for authentication…'}
          </p>
        )}
        {state.kind === 'done' && (
          <>
            <p className="claim-finalize__text">
              You've claimed <strong>{state.candidateName}</strong>.
            </p>
            <p className="claim-finalize__sub">Routing to your dashboard.</p>
          </>
        )}
        {state.kind === 'expired' && (
          <>
            <p className="claim-finalize__text">This link is no longer valid.</p>
            <p className="claim-finalize__sub">
              Magic links expire after 30 minutes. Open the candidate profile and
              start the claim again.
            </p>
            <button
              type="button"
              className="claim-finalize__btn"
              onClick={() => navigate('/app/feed')}
            >
              Back to Rep.
            </button>
          </>
        )}
        {state.kind === 'error' && (
          <>
            <p className="claim-finalize__error">{state.message}</p>
            <button
              type="button"
              className="claim-finalize__btn"
              onClick={() => navigate('/app/feed')}
            >
              Back to Rep.
            </button>
          </>
        )}
      </div>
    </div>
  );
}
