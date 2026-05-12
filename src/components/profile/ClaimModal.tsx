import { useState } from 'react';
import { service } from '../../services';
import { useEmailGate } from '../auth';
import { EmailRequiredError } from '../../utils/errors';
import {
  claimErrorToCopy,
  extractClaimError,
  getRecentClaimErrors,
  logClaimError,
} from '../../utils/claimErrorLog';
import type { CandidateId, UnclaimedCandidate } from '../../types/domain';
import type { VerifyClaimResult } from '../../services/dataService';
import './ClaimModal.css';

type Step =
  | { kind: 'intro' }
  | { kind: 'form' }
  | { kind: 'submitting' }
  | { kind: 'sent'; emailHint: string }
  | { kind: 'social-proof'; code: string; instructions: string }
  | { kind: 'social-proof-submitting'; code: string }
  | { kind: 'social-proof-submitted' }
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
        requireEmail({
          intent: { type: 'claim', candidateId: candidate.id as CandidateId },
          message: err.message,
        });
        onClose();
        return;
      }
      const detail = await extractClaimError(
        'verify-candidate-claim:initiate',
        { candidateId: candidate.id, level, filingId: trimmed },
        err,
      );
      logClaimError(detail);
      setStep({ kind: 'error', message: claimErrorToCopy(detail) });
    }
  }

  async function handleSubmitSocialProof(code: string, proofUrl: string) {
    setStep({ kind: 'social-proof-submitting', code });
    try {
      await service.submitSocialProof({
        candidateId: candidate.id as CandidateId,
        proofUrl,
      });
      setStep({ kind: 'social-proof-submitted' });
    } catch (err) {
      const detail = await extractClaimError(
        'verify-candidate-claim:initiate',
        { candidateId: candidate.id },
        err,
      );
      logClaimError(detail);
      setStep({ kind: 'error', message: claimErrorToCopy(detail) });
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
          renderSocialProof({
            code: step.code,
            instructions: step.instructions,
            onSubmit: (proofUrl) => handleSubmitSocialProof(step.code, proofUrl),
            onCancel: onClose,
          })}
        {step.kind === 'social-proof-submitting' && (
          <>
            <p className="claim-modal__text">Submitting proof URL…</p>
            <code className="claim-modal__code">{step.code}</code>
          </>
        )}
        {step.kind === 'social-proof-submitted' && renderSocialProofSubmitted(onClose)}
        {step.kind === 'error' && (
          <>
            <p className="claim-modal__error">{step.message}</p>
            <div className="claim-modal__row">
              <button
                className="claim-modal__btn claim-modal__btn--ghost"
                type="button"
                onClick={copyClaimDiagnostics}
              >
                Copy diagnostics
              </button>
              <button
                className="claim-modal__btn"
                type="button"
                onClick={() => setStep({ kind: 'form' })}
              >
                Try again
              </button>
            </div>
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

type SocialProofProps = {
  code: string;
  instructions: string;
  onSubmit: (proofUrl: string) => void;
  onCancel: () => void;
};

function renderSocialProof(props: SocialProofProps) {
  return <SocialProofForm {...props} />;
}

function SocialProofForm({ code, instructions, onSubmit, onCancel }: SocialProofProps) {
  const [proofUrl, setProofUrl] = useState('');
  const [touched, setTouched] = useState(false);
  const trimmed = proofUrl.trim();
  let parseError: string | null = null;
  if (touched && trimmed) {
    try {
      const u = new URL(trimmed);
      if (u.protocol !== 'https:' && u.protocol !== 'http:') {
        parseError = 'Use a full http(s) link.';
      }
    } catch {
      parseError = 'That does not look like a valid URL.';
    }
  }
  const disabled = !trimmed || Boolean(parseError);

  return (
    <>
      <p className="claim-modal__text">No email on file for this candidate.</p>
      <p className="claim-modal__sub">{instructions}</p>
      <code className="claim-modal__code">{code}</code>
      <label className="claim-modal__label" htmlFor="claim-proof-url">
        Where did you post this code?
      </label>
      <input
        id="claim-proof-url"
        className="claim-modal__input"
        type="url"
        value={proofUrl}
        onChange={(e) => setProofUrl(e.target.value)}
        onBlur={() => setTouched(true)}
        placeholder="https://x.com/yourcampaign/status/..."
        autoComplete="off"
        inputMode="url"
      />
      {parseError && <p className="claim-modal__error">{parseError}</p>}
      <p className="claim-modal__sub">
        Link the public post (X, Instagram, Facebook, or a page on your campaign
        domain) that contains the code above. We will review and email you within
        24 hours.
      </p>
      <div className="claim-modal__row">
        <button
          className="claim-modal__btn claim-modal__btn--ghost"
          type="button"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="claim-modal__btn"
          type="button"
          onClick={() => onSubmit(trimmed)}
          disabled={disabled}
        >
          Submit for review
        </button>
      </div>
    </>
  );
}

function renderSocialProofSubmitted(onClose: () => void) {
  return (
    <>
      <p className="claim-modal__text">Submitted for review.</p>
      <p className="claim-modal__sub">
        We will check the link against your candidate identity and email you a
        verification result within 24 hours. If approved, your profile flips to
        claimed and you can sign in to the dashboard immediately.
      </p>
      <button className="claim-modal__btn" type="button" onClick={onClose}>
        Done
      </button>
    </>
  );
}

// Copy the most recent client-side claim error diagnostics to the clipboard.
// Useful for mobile dogfooding where DevTools is not available: the user
// hits an error, taps "Copy diagnostics", and pastes the JSON into feedback
// (or a text to the dev) so we can see status + body without a repro.
async function copyClaimDiagnostics(): Promise<void> {
  const entries = getRecentClaimErrors();
  const text = entries.length ? JSON.stringify(entries, null, 2) : 'No diagnostics captured.';
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Older mobile browsers without async clipboard. Fall back to a prompt
    // so the user can still select + copy manually.
    window.prompt('Copy diagnostics:', text);
  }
}
