import { useState } from 'react';
import type { CandidateStatus } from '../../types/domain';
import './ProfileTabs.css';

type ProfileTab = 'positions' | 'videos' | 'qa';

interface ProfileTabsProps {
  candidateStatus: CandidateStatus;
  children: (activeTab: ProfileTab) => React.ReactNode;
}

const TAB_LABELS: Record<ProfileTab, string> = {
  positions: 'Positions',
  videos: 'Videos',
  qa: 'Q&A',
};

export function ProfileTabs({ candidateStatus, children }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>('positions');

  // Unclaimed profiles have no Videos tab
  const tabs: ProfileTab[] =
    candidateStatus === 'unclaimed'
      ? ['positions', 'qa']
      : ['positions', 'videos', 'qa'];

  return (
    <div className="profile-tabs">
      <div className="profile-tabs__strip" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`profile-tabs__tab ${activeTab === tab ? 'profile-tabs__tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>
      <div className="profile-tabs__content" role="tabpanel">
        {children(activeTab)}
      </div>
    </div>
  );
}
