import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';
import type { NavTab } from './BottomNav';
import './AppShell.css';

interface AppShellProps {
  children: ReactNode;
}

const pathToTab: Record<string, NavTab> = {
  '/app/feed': 'feed',
  '/app/districts': 'districts',
  '/app/reps': 'reps',
};

const tabToPath: Record<NavTab, string> = {
  feed: '/app/feed',
  districts: '/app/districts',
  reps: '/app/reps',
};

export function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab: NavTab = pathToTab[location.pathname] ?? 'feed';

  const handleTabChange = (tab: NavTab) => {
    navigate(tabToPath[tab]);
  };

  return (
    <div className="app-shell">
      <TopNav />
      <div className="app-shell__content">
        {children}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
