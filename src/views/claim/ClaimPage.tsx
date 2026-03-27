import { useNavigate } from 'react-router-dom';
import './ClaimPage.css';

export function ClaimPage() {
  const navigate = useNavigate();

  return (
    <div className="claim">
      <div className="claim__hero">
        <div className="claim__logo">
          Rep<span className="claim__period">.</span>
        </div>
        <div className="claim__tagline">For candidates and elected officials</div>
        <p className="claim__desc">
          Your constituents have questions. Claim your profile and respond.
        </p>
      </div>

      <div className="claim__body">
        <h2 className="claim__heading">Claim your profile</h2>
        <p className="claim__text">
          Rep. builds a profile for every candidate in covered districts using
          public Secretary of State filings. Your profile already exists —
          constituents may already be leaving questions.
        </p>

        <div className="claim__steps">
          <div className="claim__step">
            <span className="claim__step-num">01</span>
            <div>
              <strong className="claim__step-title">Find your profile</strong>
              <p className="claim__step-body">
                Search by name or filing ID to locate the profile created from your public records.
              </p>
            </div>
          </div>
          <div className="claim__step">
            <span className="claim__step-num">02</span>
            <div>
              <strong className="claim__step-title">Verify your identity</strong>
              <p className="claim__step-body">
                Confirm you are the candidate listed in the filing. Verification details depend on your office level.
              </p>
            </div>
          </div>
          <div className="claim__step">
            <span className="claim__step-num">03</span>
            <div>
              <strong className="claim__step-title">Start responding</strong>
              <p className="claim__step-body">
                Post video responses to constituent questions. Your response rate is public.
              </p>
            </div>
          </div>
        </div>

        <div className="claim__notice">
          Candidate claim is coming soon. Leave your email to be notified when it opens.
        </div>

        <button
          type="button"
          className="claim__back"
          onClick={() => navigate('/')}
        >
          Back to Rep.
        </button>
      </div>
    </div>
  );
}
