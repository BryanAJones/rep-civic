# Rep. — Feature Backlog

> Single source of truth for what's built, in progress, and planned.
> Update this file whenever a feature ships, scope changes, or new ideas surface.

## Status Key

- **done** — Shipped and working
- **in-progress** — Actively being built
- **planned** — Committed to building, scoped in ARCHITECTURE.md
- **idea** — Worth considering, not yet committed

---

## Core Platform

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Vite + React + TS scaffold | done | Phase 1 |
| 2 | CSS token system (tokens.css, reset, typography) | done | Phase 1 |
| 3 | Domain types (district, candidate, video, question, chain) | done | Phase 1 |
| 4 | DataService interface + mock implementation | done | Phase 1 |
| 5 | PWA manifest + placeholder icons | done | Phase 1 |
| 6 | ESLint + Vitest + Playwright setup | done | Phase 1 |

## Primitives

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 7 | Logotype | done | Phase 2 |
| 8 | GoldRule | done | Phase 2 |
| 9 | MonoText | done | Phase 2 |
| 10 | Tag | done | Phase 2 |
| 11 | StatusPill | done | Phase 2 |
| 12 | Avatar | done | Phase 2 |
| 13 | ScanlineOverlay | done | Phase 2 |
| 14 | PlusOneButton (3 states) | done | Phase 2 |
| 15 | EmDash | done | Phase 2 |

## Layout + Navigation

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 16 | AppRouter + protected routes | done | Phase 3 |
| 17 | UserContext + localStorage persistence | done | Phase 3 |
| 18 | TopNav (logo + back-button modes) | done | Phase 3 |
| 19 | BottomNav (4 tabs) | done | Phase 3 |
| 20 | AppShell wrapper | done | Phase 3 |
| 21 | LandingPage (full port from wireframe) | done | Phase 3 |
| 75 | Candidate entry section on landing page | done | Navy section with value props, mock unclaimed profile card, claim CTA |

## Video Feed

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 22 | VideoPlayer | done | Phase 4 |
| 23 | VideoOverlay + VideoRightRail | done | Phase 4 |
| 24 | VideoCard + VideoCaption + VideoTag | done | Phase 4 |
| 25 | FeedContext | done | Phase 4 |
| 26 | useVideoFeed hook | done | Phase 4 |
| 27 | FeedPage with snap-scroll | done | Phase 4 |

## Questions + Voting

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 28 | VideoThumbBar | done | Phase 5 |
| 29 | QuestionRow + QuestionInput | done | Phase 5 |
| 30 | QuestionDrawer overlay | done | Phase 5 |
| 31 | useQuestions + usePlusOne hooks | done | Phase 5 |
| 32 | +1 optimistic update + rollback | done | Phase 5 |
| 33 | QuestionsDrawerPage | done | Phase 5 |

## Answer Video

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 34 | QuestionContextBanner | done | Phase 6 |
| 35 | AnswerVideoPage (full integration) | done | Phase 6 — async data fetching, back nav |

## Candidate Profiles

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 36 | ProfileHeader + ProfileStats | done | Phase 7 — status-aware rendering |
| 37 | ProfileTabs (Videos / Q&A / Positions) | done | Phase 7 — conditional tabs per status |
| 38 | UnclaimedBanner | done | Phase 7 |
| 39 | PositionsList | done | Phase 7 |
| 40 | VideoGrid + EmptyVideoGrid | done | Phase 7 |
| 41 | CandidateProfilePage (3 candidate states) | done | Phase 7 — full orchestration |

## Empty States + Topics

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 42 | GeneralQuestionBox | done | Phase 8 |
| 43 | TopicCard (auto-generated topics) | done | Phase 8 |
| 44 | Empty-state prompts across views | done | Phase 8 — distributed across profile views |

## Debate Chains

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 45 | buildChainTree utility | done | Phase 9 — graph algorithm |
| 46 | ChainNodeCard + ChainRespondChips | done | Phase 9 — depth-based indentation |
| 47 | DebateChainView | done | Phase 9 — recursive tree rendering |
| 48 | DebateChainPage | done | Phase 9 |

## Onboarding

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 49 | OnboardingPage (basic address input) | done | Minimal version shipped in Phase 3 |
| 50 | Real Google Civic API integration | done | Phase 10 — civicApi.ts wired up |
| 51 | District reveal animation | planned | Phase 10 |
| 52 | Full onboarding flow (multi-step) | planned | Phase 10 |

## PWA + Production

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 53 | dvh audit (mobile viewport) | done | Phase 11 — 100dvh in AppShell + reset |
| 54 | Installability testing | done | Phase 11 — Lighthouse 95/100/100, manifest verified |
| 55 | Production icons (192 + 512) | done | Phase 11 — R. with gold period on navy, both sizes |
| 56 | Workbox caching strategies | planned | Phase 11 — using defaults, no custom strategies |
| 57 | Offline behavior + fallback | planned | Phase 11 |
| 58 | iOS/Android meta tags | done | Phase 11 — in index.html |

## Security

> Tiered roadmap from security review (2026-03-27). Each tier must be complete before the feature it gates.

### Tier 1 — Pre-Deploy Blockers

| # | Item | Status | Gates |
|---|------|--------|-------|
| S-1 | Restrict Civic API key to production domain (Google Cloud Console) | planned | Any deploy |
| S-2 | maxLength on QuestionInput (280) and address input (200) | done | Any deploy |
| S-3 | Guard localStorage against session tokens + validate districts shape | done | Constituent auth |
| S-4 | Deprecate registeredAddress in UserProfile (do not persist server-side) | done | Real backend |
| S-5 | Document authorHandle server-derivation contract | done | Constituent auth |

### Tier 2 — Before Constituent Auth

| # | Item | Status | Gates |
|---|------|--------|-------|
| S-6 | Choose and document session mechanism (magic link vs OAuth) | planned | Constituent auth |
| S-7 | Server-side vote deduplication on (userId, questionId) | planned | Real-time voting |
| S-8 | Handle reservation policy (block candidate-name squatting) | planned | Constituent auth |
| S-9 | Content-Security-Policy headers on HTML responses | planned | Any auth feature |

### Tier 3 — Before Candidate Auth / Claim Flow

| # | Item | Status | Gates |
|---|------|--------|-------|
| S-10 | Claim verification ceremony spec (highest-risk item) | planned | Candidate claim flow |
| S-11 | Separate candidate and constituent auth contexts | planned | Candidate auth |
| S-12 | Server derives candidateId from session on candidate writes | planned | Candidate auth |
| S-13 | Write-once ownership table on candidate claim | planned | Candidate claim flow |

### Tier 4 — Before Real-Time Voting

| # | Item | Status | Gates |
|---|------|--------|-------|
| S-14 | Use SSE over WebSocket for vote count broadcasting | planned | Real-time voting |
| S-15 | Rate-limit voteQuestion endpoint | planned | Real-time voting |
| S-16 | Change PWA to prompt update + no-store on sw.js | planned | Any real users |

### Tier 5 — Ongoing / Platform-Level

| # | Item | Status | Gates |
|---|------|--------|-------|
| S-17 | Backend proxy for Civic API (remove key from client) | planned | Real backend |
| S-18 | Rate-limit question submission | planned | Real backend |
| S-19 | Audit log for candidate state transitions | planned | Candidate auth |

### Bug Fixes (from security review)

| # | Item | Status | Notes |
|---|------|--------|-------|
| S-20 | Vote rollback: UNVOTE_QUESTION in UserContext on failed vote | done | usePlusOne catch block now dispatches rollback |
| S-21 | candidateId hardcoded to '' in useQuestions.submitQuestion | planned | Thread candidateId from video through to hook |

---

## Ideas (Not Yet Scoped)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 59 | Candidate claim flow (/claim/:candidateId) | idea | Separate route, mentioned in ARCHITECTURE.md |
| 60 | District browser page (real content) | idea | Currently a stub |
| 61 | Reps page (real content) | idea | Currently a stub |
| 62 | Search / discovery | idea | Not yet designed |
| 63 | Notifications | idea | Not yet designed |
| 64 | Settings page | idea | Not yet designed |
| 65 | Real backend API | idea | Stack TBD |
| 66 | Real-time +1 via WebSocket/SSE | idea | Hook-level change only |
| 67 | Candidate dashboard | idea | Not yet designed |
| 68 | Multi-market expansion (beyond Atlanta) | idea | District types will grow |
| 69 | Candidate verification (official status) | idea | Verify candidates are who they claim; trust signals beyond soft v1 approach |
| 70 | PWA hot refresh on updates | idea | Push new content to installed PWA without manual reload; critical for phone installs |
| 71 | Authentication (constituents) | idea | User accounts, login, persistent identity across devices |
| 72 | Authentication (candidates) | idea | Candidate login, ties to claim flow and video posting |
| 73 | Functioning side rail buttons | idea | VideoRightRail buttons wired to real actions (not just counts) |
| 74 | Horizontal swipe: local ↔ federal | done | Swipe gesture to shift feed between district levels (city → county → state → federal) |
| 76 | Unclaimed candidate view as primary voter experience | planned | Pre-auth default: voters see unclaimed profiles with questions and +1 voting; video feed becomes post-auth/post-claim |
| 77 | PWA install instructions | idea | In-app guidance for installing the PWA on iOS and Android; prompt or banner with platform-specific steps |
