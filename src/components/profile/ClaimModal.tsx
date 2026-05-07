import { useState } from 'react';
import { service } from '../../services';
import { useEmailGate } from '../auth';
import { EmailRequiredError } from '../../utils/errors';
import type { CandidateId, UnclaimedCandidate } from '../../types/domain';
import type { VerifyClaimResult } from '../../services/dataService';
import './ClaimModal.css';

type Step =
  | { kind: 'intro' }
  | { kind: 'form' }
  | { kind: 'submitting' }
  | { kind: 'sent'; emailHint: string }
  | { kind: 'social-proof'; code: string; instructions: string }
  | { kind: 'error'; message: string };

interface ClaimModalProps {
  candidate: UnclaimedCandidate;
  onClose: () => void;
}

// Multi-step claim modal (B6-1c). Replaces the prior one-tap claim button.
//
// Flow:
//   intro    → "This is the candidate. Continue to verify."
//   form     → level toggle + filing-ID input
//   sent     → "We sent a magic link to tre***@committee.com"
//   social-proof → "Post this code …"
//   error    → "That filing ID didn't match" / "Already claimed" / etc.
export function ClaimModal({ candidate, onClose }: ClaimModalProps) {
  const { requireEmail } = useEmailGate();
  const [step, setStep] = useState<Step>({ kind: 'intro' });
  const [level, setLevel] = useState<'federal' | 'state' | 'local'>('federal');
  const [filingId, setFilingId] = useState('');

  async function handleSubmit() {
    const trimmed = filingId.trim();
    if (!trimmed) return;
    setStep({ kind: 'submitting' });
    try {
      const result: VerifyClaimResult = await service.verifyCandidateClaim({
        candidateId: candidate.id as CandidateId,
        level,
        filingId: trimmed,
      });
      if (result.status === 'email_sent') {
        setStep({ kind: 'sent', emailHint: result.emailHint });
      } else {
        setStep({
          kind: 'social-proof',
          code: result.code,
          instructions: result.instructions,
        });
      }
    } catch (err) {
      if (err instanceof EmailRequiredError) {
        // Anonymous user — gate them to verify their own email first, then
        // bring them back to this profile with the modal re-opened.
        requireEmail({
          intent: { type: 'claim', candidateId: candidate.id as CandidateId },
          message: err.message,
        });
        onClose();
        return;
      }
      setStep({
        kind: 'error',
        message: errorToCopy(err),
      });
    }
  }

  return (
    <div className="claim-modal-backdrop" onClick={onClose}>
      <div
        className="claim-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="claim-modal-title"
      >
        <div className="claim-modal__header">
          <span id="claim-modal-title" className="claim-modal__title">
            Claim profile
          </span>
          <button
            className="claim-modal__close"
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {step.kind === 'intro' && renderIntro(candidate, () => setStep({ kind: 'form' }))}
        {step.kind === 'form' &&
          renderForm({
            candidate,
            level,
            setLevel,
            filingId,
            setFilingId,
            onBack: () => setStep({ kind: 'intro' }),
            onSubmit: handleSubmit,
          })}
        {step.kind === 'submitting' && (
          <p className="claim-modal__text">Verifying with public records…</p>
        )}
        {step.kind === 'sent' && renderSent(step.emailHint, onClose)}
        {step.kind === 'social-proof' &&
          renderSocialProof(step.code, step.instructions, onClose)}
        {step.kind === 'error' && (
          <>
            <p className="claim-modal__error">{step.message}</p>
            <button
              className="claim-modal__btn"
              type="button"
              onClick={() => setStep({ kind: 'form' })}
            >
              Try again
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function renderIntro(candidate: UnclaimedCandidate, onContinue: () => void) {
  return (
    <>
      <p className="claim-modal__text">
        You're about to claim <strong>{candidate.name}</strong> ({candidate.officeTitle}).
      </p>
      <p className="claim-modal__sub">
        We verify identity against public filings — no self-attestation. We'll send a
        magic link to the contact email on file (or guide you through a social-handle
        verification if no email is on file).
      </p>
      <button className="claim-modal__btn" type="button" onClick={onContinue}>
        Continue
      </button>
    </>
  );
}

type FormProps = {
  candidate: UnclaimedCandidate;
  level: 'federal' | 'state' | 'local';
  setLevel: (l: 'federal' | 'state' | 'local') => void;
  filingId: string;
  setFilingId: (s: string) => void;
  onBack: () => void;
  onSubmit: () => void;
};

function renderForm(props: FormProps) {
  const { candidate, level, setLevel, filingId, setFilingId, onBack, onSubmit } = props;
  const placeholder =
    level === 'federal'
      ? candidate.filingId ?? 'H6GA00000'
      : level === 'state'
        ? 'GA SOS qualifying ID'
        : 'County or city filing reference';

  return (
    <>
      <div className="claim-modal__level-strip" role="tablist">
        {(['federal', 'state', 'local'] as const).map((l) => (
          <button
            key={l}
            type="button"
            role="tab"
            aria-selected={level === l}
            className={
              'claim-modal__level' + (level === l ? ' claim-modal__level--active' : '')
            }
            onClick={() => setLevel(l)}
          >
            {l}
          </button>
        ))}
      </div>

      <label className="claim-modal__label" htmlFor="claim-filing-id">
        Filing ID
      </label>
      <input
        id="claim-filing-id"
        className="claim-modal__input"
        type="text"
        value={filingId}
        onChange={(e) => setFilingId(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        autoFocus
      />
      <p className="claim-modal__sub">
        {level === 'federal' ? (
          <>
            Find your FEC candidate ID on{' '}
            <a
              className="claim-modal__link"
              href={
                candidate.filingId
                  ? `https://www.fec.gov/data/candidate/${candidate.filingId}/`
                  : 'https://www.fec.gov/data/candidates/'
              }
              target="_blank"
              rel="noreferrer"
            >
              fec.gov
            </a>
            . Format: H6GA00000 (House) or S6GA00000 (Senate).
          </>
        ) : level === 'state' ? (
          'State verification is rolling out in phase 4. Federal candidates can claim today.'
        ) : (
          'Local self-claim is in design (phase 6). Federal candidates can claim today.'
        )}
      </p>

      <div className="claim-modal__row">
        <button
          className="claim-modal__btn claim-modal__btn--ghost"
          type="button"
          onClick={onBack}
        >
          Back
        </button>
        <button
          className="claim-modal__btn"
          type="button"
          onClick={onSubmit}
          disabled={!filingId.trim() || level !== 'federal'}
        >
          Verify
        </button>
      </div>
    </>
  );
}

function renderSent(emailHint: string, onClose: () => void) {
  return (
    <>
      <p className="claim-modal__text">
        We sent a verification link to{' '}
        <code className="claim-modal__mono">{emailHint}</code>.
      </p>
      <p className="claim-modal__sub">
        Open that inbox and click the link to finish claiming. The link expires in
        30 minutes.
      </p>
      <button className="claim-modal__btn" type="button" onClick={onClose}>
        Done
      </button>
    </>
  );
}

function renderSocialProof(code: string, instructions: string, onClose: () => void) {
  return (
    <>
      <p className="claim-modal__text">No email on file for this candidate.</p>
      <p className="claim-modal__sub">{instructions}</p>
      <code className="claim-modal__code">{code}</code>
      <p className="claim-modal__sub">
        Social-handle verification ships in phase 5. Save this code; we'll add the
        verification step soon.
      </p>
      <button className="claim-modal__btn" type="button" onClick={onClose}>
        Done
      </button>
    </>
  );
}

function errorToCopy(err: unknown): string {
  if (!err || typeof err !== 'object') return 'Could not verify. Try again in a moment.';
  const message = (err as { message?: string }).message;
  const context = (err as { context?: { status?: number } }).context;
  const status = context?.status ?? (err as { status?: number }).status;
  if (status === 404) return "That filing ID doesn't match this candidate.";
  if (status === 409) return 'This profile already has a pending claim or has been claimed.';
  if (status === 429) {
    const code = (err as { context?: { body?: { code?: string } } }).context?.body?.code;
    if (code === 'OTP_RATE_LIMIT') {
      return "We've sent too many verification emails recently. Try again in about an hour.";
    }
    return 'Too many attempts. Try again in an hour.';
  }
  if (status === 501) {
    return 'Only federal verification is live in phase 1. Other levels are rolling out.';
  }
  if (status === 502) return 'Could not reach FEC. Try again in a moment.';
  return message || 'Could not verify. Try again in a moment.';
}
