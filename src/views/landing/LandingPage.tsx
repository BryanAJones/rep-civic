import { useNavigate } from 'react-router-dom';
import { changelog } from '../../data/changelog';
import './LandingPage.css';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      {/* Top rule */}
      <div className="landing__rule" role="presentation" />

      {/* Masthead */}
      <header className="landing__masthead">
        <div className="landing__container">
          <div className="landing__meta-row">
            <span className="landing__dateline">Atlanta, GA · Est. 2026</span>
            <span className="landing__edition">Civic accountability platform</span>
          </div>
          <div className="landing__logo-row">
            <h1 className="landing__logotype">
              Rep<span className="landing__period">.</span>
            </h1>
            <div className="landing__tagline-block">
              <p className="landing__tagline">Know your district. Know your representatives.</p>
              <p className="landing__desc">
                Every person elected to represent you — from school board to Senate
                — directly accountable to your neighborhood.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main>
      {/* Hook */}
      <section className="landing__hook">
        <div className="landing__container landing__hook-layout">
          <div className="landing__hook-text">
            <div className="landing__kicker">The problem</div>
            <h2 className="landing__headline">
              You voted for these people. Do you know what they're doing?
            </h2>
            <p className="landing__body">
              Nine in ten voters cannot recall the name of their state
              representative. Rep. changes that — by showing you every
              official in your actual voting districts and giving you a direct
              line to ask them anything.
            </p>
            <div className="landing__cta-row">
              <button
                className="landing__btn-primary"
                type="button"
                onClick={() => navigate('/onboarding')}
              >
                Get started
              </button>
              <a href="#how" className="landing__btn-secondary">
                For voters →
              </a>
              <a href="#candidates" className="landing__btn-secondary">
                For candidates →
              </a>
            </div>
          </div>
          <div className="landing__hook-img">
            <img
              src="/images/meeting.jpg"
              alt="Community members gathered for a civic discussion"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="landing__how" id="how">
        <div className="landing__container">
          <div className="landing__eyebrow">How it works</div>
          <h2 className="landing__section-headline">
            Three steps to knowing who represents you.
          </h2>
          <div className="landing__steps">
            <div className="landing__step">
              <img
                className="landing__step-img"
                src="/images/neighborhood.jpg"
                alt="Aerial view of a residential neighborhood"
                loading="lazy"
              />
              <div className="landing__step-content">
                <div className="landing__step-num" aria-hidden="true">01</div>
                <h3 className="landing__step-title">Enter your address</h3>
                <p className="landing__step-body">
                  Rep. uses your home address to identify every voting district
                  you belong to — from city council and school board up to your
                  congressional and Senate districts.
                </p>
              </div>
            </div>
            <div className="landing__step">
              <img
                className="landing__step-img"
                src="/images/representatives.jpg"
                alt="People gathered around a table in a working session"
                loading="lazy"
              />
              <div className="landing__step-content">
                <div className="landing__step-num" aria-hidden="true">02</div>
                <h3 className="landing__step-title">See your representatives</h3>
                <p className="landing__step-body">
                  Every elected official and every candidate in your actual
                  districts appears in your feed — pulled from public records.
                  Nothing from outside your districts.
                </p>
              </div>
            </div>
            <div className="landing__step">
              <img
                className="landing__step-img"
                src="/images/hands.jpg"
                alt="Constituent raising a fist in a crowded civic event"
                loading="lazy"
              />
              <div className="landing__step-content">
                <div className="landing__step-num" aria-hidden="true">03</div>
                <h3 className="landing__step-title">Hold them accountable</h3>
                <p className="landing__step-body">
                  Watch their videos, read their positions, +1 questions your
                  neighbors have asked. Candidates who join Rep. can respond
                  directly — on video, on the record.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proof band */}
      <section className="landing__proof">
        <div className="landing__container landing__proof-inner">
          <div className="landing__proof-item">
            <div className="landing__proof-num">9<span>/10</span></div>
            <div className="landing__proof-label">
              voters cannot recall the name of their state representative
            </div>
            <cite className="landing__proof-cite">
              Rogers, Accountability in State Legislatures (U. Chicago Press, 2023)
            </cite>
          </div>
          <div className="landing__proof-item">
            <div className="landing__proof-num">25<span>+</span></div>
            <div className="landing__proof-label">
              elected officials represent the average US address
            </div>
            <cite className="landing__proof-cite">
              Ballotpedia; U.S. Census of Governments
            </cite>
          </div>
          <div className="landing__proof-item">
            <div className="landing__proof-num">83<span>%</span></div>
            <div className="landing__proof-label">
              of U.S. House seats effectively decided in primary elections
            </div>
            <cite className="landing__proof-cite">
              Unite America, "The Primary Problem" (2022)
            </cite>
          </div>
        </div>
      </section>

      {/* For candidates */}
      <section className="landing__candidates" id="candidates">
        <div className="landing__container">
          <div className="landing__candidates-layout">
            <div className="landing__candidates-text">
              <div className="landing__eyebrow">For candidates and elected officials</div>
              <h2 className="landing__headline">
                Your constituents have questions. They are not waiting for campaign season.
              </h2>
              <p className="landing__body">
                Rep. builds a profile for every candidate in covered districts using
                public Secretary of State filings. Constituents are already leaving
                questions — before you even join. The longer your profile stays
                unclaimed, the more unanswered questions accumulate.
              </p>
              <div className="landing__candidates-points">
                <div className="landing__candidates-point">
                  <span className="landing__candidates-point-label">Direct access</span>
                  <span className="landing__candidates-point-desc">
                    Respond to voters on video, on the record. No algorithm between you
                    and your district.
                  </span>
                </div>
                <div className="landing__candidates-point">
                  <span className="landing__candidates-point-label">Visible accountability</span>
                  <span className="landing__candidates-point-desc">
                    Your response rate is public. Constituents see who engages and
                    who avoids.
                  </span>
                </div>
                <div className="landing__candidates-point">
                  <span className="landing__candidates-point-label">Competitive pressure</span>
                  <span className="landing__candidates-point-desc">
                    When opponents claim their profiles, voters notice who has not.
                  </span>
                </div>
              </div>
              <button
                className="landing__btn-gold"
                type="button"
                onClick={() => navigate('/claim')}
              >
                Claim your profile
              </button>
              <p className="landing__candidates-fine">
                Free to claim. Built from public filing records.
              </p>
            </div>
            <div className="landing__candidates-preview">
              <div className="landing__profile-card">
                <div className="landing__profile-card-header">
                  <div className="landing__profile-avatar">SR</div>
                  <div className="landing__profile-info">
                    <div className="landing__profile-name">Sandra Reyes</div>
                    <div className="landing__profile-office">State Senator, District 40</div>
                    <div className="landing__profile-meta-row">
                      <span className="landing__profile-party">Democrat</span>
                      <span className="landing__profile-pill">Not yet joined</span>
                    </div>
                  </div>
                </div>
                <div className="landing__profile-card-rule" />
                <div className="landing__profile-stats">
                  <div className="landing__profile-stat">
                    <span className="landing__profile-stat-num">47</span>
                    <span className="landing__profile-stat-label">Questions waiting</span>
                  </div>
                  <div className="landing__profile-stat">
                    <span className="landing__profile-stat-num">2</span>
                    <span className="landing__profile-stat-label">Opponents active</span>
                  </div>
                  <div className="landing__profile-stat">
                    <span className="landing__profile-stat-num">—</span>
                    <span className="landing__profile-stat-label">Response rate</span>
                  </div>
                </div>
                <div className="landing__profile-card-rule" />
                <div className="landing__profile-question">
                  <div className="landing__profile-question-votes">+38</div>
                  <div className="landing__profile-question-text">
                    Where do you stand on the Beltline transit expansion funding?
                  </div>
                </div>
                <div className="landing__profile-question">
                  <div className="landing__profile-question-votes">+24</div>
                  <div className="landing__profile-question-text">
                    What is your plan for affordable housing in District 40?
                  </div>
                </div>
                <div className="landing__profile-filing">
                  <span>GA SOS #0044821</span>
                  <span>Filed 2025-11-14</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Development Log */}
      <section className="landing__devlog">
        <div className="landing__container">
          <div className="landing__eyebrow">Development log</div>
          <h2 className="landing__section-headline">
            What we shipped.
          </h2>
          <div className="landing__devlog-entries">
            {changelog.map((entry) => (
              <article key={entry.version} className="landing__devlog-entry">
                <div className="landing__devlog-meta">
                  <span className="landing__devlog-version">v{entry.version}</span>
                  <span className="landing__devlog-date">{entry.date}</span>
                </div>
                <h3 className="landing__devlog-title">{entry.title}</h3>
                <ul className="landing__devlog-items">
                  {entry.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing__cta-section">
        <div className="landing__container" style={{ textAlign: 'center' }}>
          <div className="landing__eyebrow">Get started</div>
          <h2 className="landing__cta-headline">
            Rep<span className="landing__period">.</span> is live in Atlanta.
          </h2>
          <p className="landing__cta-sub">
            Enter your address and see every person who represents you.
          </p>
          <button
            className="landing__btn-gold"
            type="button"
            onClick={() => navigate('/onboarding')}
          >
            Find my representatives
          </button>
        </div>
      </section>

      </main>

      {/* Footer */}
      <footer className="landing__footer">
        <div className="landing__container landing__footer-inner">
          <div className="landing__footer-logo">
            Rep<span className="landing__period">.</span>
          </div>
          <div className="landing__footer-text">Built in Atlanta, GA · 2026</div>
        </div>
      </footer>
    </div>
  );
}
