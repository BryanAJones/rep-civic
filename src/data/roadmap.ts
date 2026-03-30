export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  category: string;
}

/**
 * Planned features shown in the "Coming soon" section on the landing page.
 * Derived from planned items in BACKLOG.md.
 */
export const roadmap: RoadmapItem[] = [
  {
    id: 'r-1',
    title: 'Unclaimed profiles as default voter experience',
    description: 'See every representative in your districts with questions and voting — before anyone claims their profile.',
    category: 'Voter experience',
  },
  {
    id: 'r-2',
    title: 'Full onboarding with district reveal',
    description: 'Multi-step onboarding with animated district reveal as each level is resolved from your address.',
    category: 'Onboarding',
  },
  {
    id: 'r-3',
    title: 'Offline support',
    description: 'Cached content and graceful offline fallbacks so the app works without a connection.',
    category: 'PWA',
  },
  {
    id: 'r-4',
    title: 'Constituent authentication',
    description: 'User accounts with persistent identity across devices. Your questions and votes follow you.',
    category: 'Auth',
  },
  {
    id: 'r-5',
    title: 'Candidate claim and verification',
    description: 'Candidates claim their auto-generated profiles and respond to constituent questions on video.',
    category: 'Candidates',
  },
  {
    id: 'r-6',
    title: 'Real-time voting',
    description: 'Live +1 counts via server-sent events so you see community consensus as it forms.',
    category: 'Engagement',
  },
  {
    id: 'r-7',
    title: 'Content security policy and API proxy',
    description: 'Backend proxy for external APIs and strict CSP headers for production security.',
    category: 'Security',
  },
];
