import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { service } from '../services';
import { clearPendingIntent, getPendingIntent } from '../utils/pendingIntent';

// Runs once after the user becomes email-verified (transition from
// isAnonymous=true -> false). Replays whatever the user was trying to
// do before being interrupted by the magic-link round-trip.
//
// Lives at app shell level (mounted by AppRouter) so it works regardless
// of which route the magic link drops the user on.
export function usePendingIntentRunner() {
  const { state, dispatch } = useUser();
  const navigate = useNavigate();
  const hasRun = useRef(false);

  useEffect(() => {
    if (!state.authReady || state.isAnonymous || hasRun.current) return;
    const intent = getPendingIntent();
    if (!intent) return;
    hasRun.current = true;

    (async () => {
      try {
        switch (intent.type) {
          case 'vote': {
            await service.voteQuestion(intent.questionId);
            dispatch({ type: 'VOTE_QUESTION', questionId: intent.questionId });
            break;
          }
          case 'submit-question': {
            await service.submitQuestion(
              intent.candidateId,
              intent.videoId,
              intent.text,
              intent.topicId ?? undefined,
            );
            break;
          }
          case 'claim': {
            // The verified-claim flow needs the user to interact with the
            // multi-step modal (filing-ID input). After the email-gate
            // round-trip we route them back to the candidate profile with
            // ?claim=1 so the page auto-opens the modal — they pick up
            // exactly where they were when the gate fired.
            navigate(`/app/profile/${intent.candidateId}?claim=1`);
            break;
          }
        }
      } catch {
        // Intent failed (e.g. duplicate vote, candidate already claimed) —
        // silently drop. The user is now signed in; they can retry manually.
      } finally {
        clearPendingIntent();
      }
    })();
  }, [state.authReady, state.isAnonymous, dispatch, navigate]);
}
