import { type ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';
import { FeedbackModal } from '../feedback';
import type { NavTab } from './BottomNav';
import './AppShell.css';

interface AppShellProps {
  children: ReactNode;
}

const pathToTab: Record<string, NavTab> = {
  '/app/feed': 'feed',
  '/app/districts': 'districts',
  '/app/you': 'you',
};

const tabToPath: Record<NavTab, string> = {
  feed: '/app/feed',
  districts: '/app/districts',
  you: '/app/you',
};

export function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showFeedback, setShowFeedback] = useState(false);

  const activeTab: NavTab = pathToTab[location.pathname] ?? 'feed';

  const handleTabChange = (tab: NavTab) => {
    navigate(tabToPath[tab]);
  };

  return (
    <div className="app-shell">
      <TopNav onFeedback={() => setShowFeedback(true)} />
      <div className="app-shell__content">
        {children}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      {showFeedback && (
        <FeedbackModal
          page={location.pathname}
          onClose={() => setShowFeedback(false)}
        />
      )}
    </div>
  );
}
