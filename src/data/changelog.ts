export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  items: string[];
}

/**
 * Changelog entries displayed on the landing page.
 * Newest first. Keep entries concise — full details live in CHANGELOG.md.
 *
 * When shipping a new phase or feature:
 * 1. Add an entry here (top of the array)
 * 2. Update CHANGELOG.md with full details
 * 3. Update BACKLOG.md status for completed items
 */
export const changelog: ChangelogEntry[] = [
  {
    version: '0.15',
    date: '2026-03-30',
    title: 'Live data from Supabase',
    items: [
      'App now reads candidates, videos, questions, and debates from Supabase',
      'District resolution populates real candidate profiles for your address',
      'Feedback submissions saved to the database',
    ],
  },
  {
    version: '0.14',
    date: '2026-03-29',
    title: 'Real candidate data and district resolution',
    items: [
      'Database schema deployed to Supabase with 11 tables and public-read policies',
      '465 Georgia candidates imported from FEC and OpenStates public records',
      'District resolution switched from Google Civic to Geocodio API',
      'Data pipeline: download, transform, and seed scripts for repeatable imports',
    ],
  },
  {
    version: '0.13',
    date: '2026-03-27',
    title: 'Feedback, roadmap, and account tab',
    items: [
      'Feedback modal accessible from every screen with category tagging',
      'Coming soon section on landing page with community upvote/downvote',
      'You tab replacing Reps with district listing and account placeholder',
      'Fluid responsive sizing using container query units',
      'Candidate name and office restored on video feed cards',
    ],
  },
  {
    version: '0.12',
    date: '2026-03-27',
    title: 'District level swipe navigation',
    items: [
      'Horizontal swipe to switch feed between city, county, state, federal, and all',
      'Sliding label with dot indicators tracking swipe progress',
      'Scroll position preserved when switching between levels',
      'Empty district levels automatically skipped',
    ],
  },
  {
    version: '0.11',
    date: '2026-03-27',
    title: 'Security, installability, and candidate entry',
    items: [
      'Production PWA icons and manifest — installable on mobile',
      'Security hardening: input limits, localStorage validation, vote rollback',
      'Candidate entry section on landing page with claim CTA',
      'Accessibility fixes for WCAG AA color contrast',
      'Development log section on landing page',
    ],
  },
  {
    version: '0.9',
    date: '2026-03-27',
    title: 'Debate chains',
    items: [
      'Chain tree builder converting flat nodes to visual hierarchy',
      'Depth-based node indentation with connector lines',
      'Respond chips showing remaining responses per candidate',
      'Recursive chain visualization with stats footer',
    ],
  },
  {
    version: '0.8',
    date: '2026-03-27',
    title: 'Empty states and topics',
    items: [
      'Topic cards with source badges and nested questions',
      'General question box for unclaimed profiles',
      'Contextual empty-state prompts across all profile views',
    ],
  },
  {
    version: '0.7',
    date: '2026-03-27',
    title: 'Candidate profiles',
    items: [
      'Three-tab profile layout (Videos, Q&A, Positions)',
      'Status-aware rendering for unclaimed, claimed, and active candidates',
      'Video grid with chain badge indicators',
      'Unclaimed profile banner and empty grid placeholders',
    ],
  },
  {
    version: '0.6',
    date: '2026-03-27',
    title: 'Answer video',
    items: [
      'Full-screen answer video with question context banner',
      'Async data fetching with loading and error states',
      'Back navigation returning to questions drawer',
    ],
  },
  {
    version: '0.5',
    date: '2026-03-21',
    title: 'Questions drawer with +1 voting',
    items: [
      'Question drawer overlay on video feed',
      '+1 voting with optimistic updates',
      'Sort questions by community vote count',
      'Submit new questions from the drawer',
    ],
  },
  {
    version: '0.4',
    date: '2026-03-26',
    title: 'Video feed with snap-scroll',
    items: [
      'Full-screen vertical video feed',
      'Snap-scroll navigation between videos',
      'Video overlays with reaction and question counts',
    ],
  },
  {
    version: '0.3',
    date: '2026-03-25',
    title: 'Layout shell and routing',
    items: [
      'App shell with top nav, bottom nav, and gold rule',
      'Protected routing with onboarding gate',
      'Landing page ported from wireframe',
      'Basic onboarding with address input',
    ],
  },
  {
    version: '0.2',
    date: '2026-03-24',
    title: 'Primitive components',
    items: [
      'Brand primitives: logotype, gold rule, status pill, avatar',
      '+1 button with three interactive states',
      'Scan-line overlay for video backgrounds',
    ],
  },
  {
    version: '0.1',
    date: '2026-03-23',
    title: 'Foundation',
    items: [
      'Vite + React + TypeScript scaffold',
      'CSS token system and brand typography',
      'Domain types and mock data service',
      'PWA manifest and test infrastructure',
    ],
  },
];
