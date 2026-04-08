import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout';
import { useUser } from '../context/UserContext';
import { FeedPage } from '../views/feed/FeedPage';
import { AnswerVideoPage } from '../views/feed/AnswerVideoPage';
import { DistrictBrowserPage } from '../views/districts/DistrictBrowserPage';
import { YouPage } from '../views/you/YouPage';
import { CandidateProfilePage } from '../views/profile/CandidateProfilePage';
import { DebateChainPage } from '../views/chain/DebateChainPage';
import { BallotPage } from '../views/ballot/BallotPage';
import { OnboardingPage } from '../views/onboarding/OnboardingPage';
import { LandingPage } from '../views/landing/LandingPage';
import { ClaimPage } from '../views/claim/ClaimPage';

function ProtectedApp() {
  const { state } = useUser();

  if (!state.hasCompletedOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <AppShell>
      <Routes>
        <Route index element={<Navigate to="feed" replace />} />
        <Route path="feed" element={<FeedPage />} />
        <Route path="feed/video/:videoId/answer/:answerId" element={<AnswerVideoPage />} />
        <Route path="ballot" element={<BallotPage />} />
        <Route path="districts" element={<DistrictBrowserPage />} />
        <Route path="you" element={<YouPage />} />
        <Route path="profile/:candidateId" element={<CandidateProfilePage />} />
        <Route path="chain/:chainId" element={<DebateChainPage />} />
        <Route path="*" element={<Navigate to="feed" replace />} />
      </Routes>
    </AppShell>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/claim" element={<ClaimPage />} />
        <Route path="/app/*" element={<ProtectedApp />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
}
