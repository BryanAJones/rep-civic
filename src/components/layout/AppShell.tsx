import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';
import type { NavTab } from './BottomNav';
import './AppShell.css';

interface AppShellProps {
  children: ReactNode;
  contextString?: string;
}

const pathToTab: Record<string, NavTab> = {
  '/app/feed': 'feed',
  '/app/districts': 'districts',
  '/app/ask': 'ask',
  '/app/reps': 'reps',
};

const tabToPath: Record<NavTab, string> = {
  feed: '/app/feed',
  districts: '/app/districts',
  ask: '/app/ask',
  reps: '/app/reps',
};

export function AppShell({ children, contextString }: AppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab: NavTab = pathToTab[location.pathname] ?? 'feed';

  const handleTabChange = (tab: NavTab) => {
    navigate(tabToPath[tab]);
  };

  return (
    <div className="app-shell">
      <TopNav contextString={contextString} />
      <div className="app-shell__content">
        {children}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
