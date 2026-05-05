import { Navigate } from 'react-router-dom';
import { useMyClaim } from '../../hooks/useMyClaim';
import { useDashboardInbox } from '../../hooks/useDashboardInbox';
import { Avatar, MonoText, StatusPill } from '../../components/primitives';
import { InboxQuestionRow } from './InboxQuestionRow';
import './DashboardPage.css';

export function DashboardPage() {
  const { claim, loading: claimLoading } = useMyClaim();
  const { questions, loading: inboxLoading, error, submitAnswer } = useDashboardInbox(claim?.id ?? null);

  if (claimLoading) {
    return <div className="dashboard-page__loading">Loading dashboard...</div>;
  }

  if (!claim) {
    // No claim — bounce out of the dashboard route to the You page where
    // the user can find the claim flow.
    return <Navigate to="/app/you" replace />;
  }

  const unanswered = questions.filter((q) => q.state !== 'answered');
  const answered = questions.filter((q) => q.state === 'answered');

  return (
    <div className="dashboard-page">
      <header className="dashboard-page__header">
        <Avatar initials={claim.initials} variant="claimed" size={48} />
        <div className="dashboard-page__header-body">
          <h1 className="dashboard-page__name">{claim.name}</h1>
          <div className="dashboard-page__office">{claim.officeTitle}</div>
          <div className="dashboard-page__meta">
            <StatusPill variant="claimed" />
            <MonoText size={10} opacity={0.5}>{claim.party}</MonoText>
          </div>
        </div>
      </header>

      <section className="dashboard-page__section">
        <h2 className="dashboard-page__section-title">
          Inbox <MonoText size={11} color="var(--rep-gold)">{unanswered.length}</MonoText>
        </h2>
        {inboxLoading && <p className="dashboard-page__status">Loading questions...</p>}
        {error && <p className="dashboard-page__status">{error}</p>}
        {!inboxLoading && !error && unanswered.length === 0 && (
          <p className="dashboard-page__status">No unanswered questions yet.</p>
        )}
        <ul className="dashboard-page__list">
          {unanswered.map((q) => (
            <li key={q.id}>
              <InboxQuestionRow question={q} onSubmitAnswer={submitAnswer} />
            </li>
          ))}
        </ul>
      </section>

      {answered.length > 0 && (
        <section className="dashboard-page__section">
          <h2 className="dashboard-page__section-title">
            Answered <MonoText size={11} opacity={0.5}>{answered.length}</MonoText>
          </h2>
          <ul className="dashboard-page__list">
            {answered.map((q) => (
              <li key={q.id}>
                <InboxQuestionRow question={q} onSubmitAnswer={submitAnswer} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
