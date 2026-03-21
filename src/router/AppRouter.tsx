import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout';
import { useUser } from '../context/UserContext';
import { FeedPage } from '../views/feed/FeedPage';
import { DistrictBrowserPage } from '../views/districts/DistrictBrowserPage';
import { RepsPage } from '../views/reps/RepsPage';

function ProtectedApp() {
  const { state } = useUser();

  // Skip onboarding guard during dev — uncomment when onboarding is built
  // if (!state.hasCompletedOnboarding) {
  //   return <Navigate to="/onboarding" replace />;
  // }

  const districtCodes = state.districts.map((d) => d.code).join(' · ') || '6 districts';

  return (
    <AppShell contextString={districtCodes}>
      <Routes>
        <Route index element={<Navigate to="feed" replace />} />
        <Route path="feed" element={<FeedPage />} />
        <Route path="districts" element={<DistrictBrowserPage />} />
        <Route path="ask" element={<Navigate to="feed" replace />} />
        <Route path="reps" element={<RepsPage />} />
        <Route path="*" element={<Navigate to="feed" replace />} />
      </Routes>
    </AppShell>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/app/feed" replace />} />
        <Route path="/app/*" element={<ProtectedApp />} />
        <Route path="*" element={<Navigate to="/app/feed" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
