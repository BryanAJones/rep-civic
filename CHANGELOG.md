# Rep. — Changelog

> What shipped and when. Newest entries first.
> Each entry corresponds to a git commit or logical milestone.

---

## Backend Phase B3 — Write API (Edge Functions)
**Commit:** pending | **Status:** Shipped

- Created 4 Supabase Edge Functions (Deno): submit-question, vote-question, submit-feedback, proxy-geocodio
- submit-question: server-side insert with text length validation (280), candidate existence check, service_role auth
- vote-question: ON CONFLICT dedup (solves S-7) + atomic increment via `increment_plus_one` SQL RPC
- submit-feedback: validated insert with category/text/email checks
- proxy-geocodio: server-side Geocodio API key (solves S-17), address validation (200 chars)
- Added migration for `increment_plus_one` RPC function
- Updated supabaseService.ts to call Edge Functions via `supabase.functions.invoke()` for all writes + district resolution
- CORS handled via `@supabase/supabase-js/cors` built-in (no shared file needed)
- All 110 tests pass

---

## Backend Phase B2 — Real Read API
**Commit:** pending | **Status:** Shipped

- Created `supabaseClient.ts` — typed Supabase client init from env vars
- Created `supabaseService.ts` — implements full DataService interface against Supabase
- Swapped service export from mockService to supabaseService in `index.ts`
- `getFeedVideos` queries candidates by district code, fetches videos, denormalizes candidate name/office/level
- `getDebateChain` uses parallel fetch for chain_nodes + chain_participants
- Write methods (submitQuestion, voteQuestion, submitFeedback) use temporary client-side inserts until Edge Functions (B3)
- All 110 tests pass

---

## Backend Phase B1 — Schema, Data Import, Geocodio Swap
**Commit:** pending | **Status:** Shipped

- Supabase project created and linked (project ID: ocpcejomntxqsboswhrx)
- Initial migration deployed: 11 tables (districts, candidates, videos, questions, topics, debate_chains, chain_participants, chain_nodes, question_votes, candidate_positions, feedback), indexes, RLS public-read policies, updated_at trigger
- TypeScript types auto-generated at src/types/supabase.ts
- Data import pipeline: FEC bulk CSV (243 GA federal candidates) + OpenStates CSV (233 GA state legislators) = 465 candidates across 250 districts
- Three-step pipeline: `npm run import:download` → `import:transform` → `import:seed`
- District codes use OCD-ID format (STATE:GA-CD:5, STATE:GA-SLDL:60, STATE:GA-SLDU:34) matching Geocodio output
- Replaced Google Civic Information API (shut down April 2025) with Geocodio geocode API (fields=cd,stateleg)
- U.S. Senate at-large district auto-added for Georgia addresses
- All 110 tests pass (6 new Geocodio tests)

---

## Horizontal Swipe — District Level Navigation
**Commit:** pending | **Status:** Shipped

- Horizontal swipe gesture on the video feed to switch between district levels (city, county, state, federal, all)
- TikTok-style sliding label with dot indicators synced to swipe progress
- Raw pointer event handling with axis locking (horizontal vs vertical)
- Rubber-band resistance at edges, velocity-based snap
- Per-level scroll position memory preserved across swipes
- Level filtering wired through useVideoFeed and DataService
- Empty levels auto-skipped based on user's districts
- Additional mock video data across all levels for meaningful demo

---

## Phase 11 — PWA Finalization (partial)
**Commit:** uncommitted | **Status:** Partially shipped

- dvh audit complete: 100dvh used in AppShell and body reset
- iOS/Android meta tags in index.html (apple-mobile-web-app-capable, theme-color, viewport-fit=cover)
- Manifest configured with standalone display, correct start_url and theme
- **Not yet done:** Production PNG icons (manifest refs exist but files missing), custom Workbox caching strategies, offline fallback behavior, installability verification

---

## Phase 10 — Onboarding (partial)
**Commit:** uncommitted | **Status:** Partially shipped

- Google Civic Information API client fully implemented (civicApi.ts)
- Real district resolution from address with level and code parsing
- API key via VITE_CIVIC_API_KEY environment variable
- Error handling for API failures
- **Not yet done:** District reveal animation, multi-step onboarding flow

---

## Phase 9 — Debate Chains
**Commit:** uncommitted | **Status:** Shipped

- buildChainTree utility converting flat node arrays to tree structure
- ChainNodeCard with depth-based indentation and connector lines
- ChainRespondChips filtering participants by remaining responses
- DebateChainView with recursive tree traversal and stats footer
- DebateChainPage with useDebateChain hook integration

---

## Phase 8 — Empty States and Topics
**Commit:** uncommitted | **Status:** Shipped

- TopicCard with source badge, nested QuestionRow list, and QuestionInput
- GeneralQuestionBox with dynamic candidate name interpolation
- Empty-state prompts distributed across profile views (positions, videos, Q&A)

---

## Phase 7 — Candidate Profiles
**Commit:** uncommitted | **Status:** Shipped

- ProfileHeader with status-aware rendering (unclaimed vs claimed)
- ProfileStats with conditional display and EmDash for absent data
- ProfileTabs with state management and accessibility roles
- UnclaimedBanner informational component
- PositionsList with empty state handling
- VideoGrid with chain badge conditional rendering
- EmptyVideoGrid with placeholder cells and contextual messaging
- CandidateProfilePage orchestrating all profile components with tab routing

---

## Phase 6 — Answer Video
**Commit:** uncommitted | **Status:** Shipped

- QuestionContextBanner displaying answered question text
- AnswerVideoPage with async data fetching, loading/error states, back navigation
- ScanlineOverlay and VideoRightRail integration on answer view

---

## Phase 5 — Questions Drawer with +1 Voting
**Commit:** `99ae425` | **Status:** Shipped

- VideoThumbBar component for compressed video context at drawer top
- QuestionRow with +1 button integration and vote state rendering
- QuestionInput with submit handling
- QuestionDrawer overlay composing all question sub-components
- useQuestions hook with sort-by-votes logic
- usePlusOne hook with optimistic update and rollback on error
- QuestionsDrawerPage wired into feed routing
- Full test coverage for drawer, input, row, and hook behavior

---

## Phase 4 — Video Feed with Snap-Scroll
**Commit:** `2fe0b30` | **Status:** Shipped

- VideoPlayer component for full-screen video rendering
- VideoOverlay and VideoRightRail (reaction + question counts)
- VideoCard, VideoCaption, and VideoTag components
- FeedContext for active video index and feed state
- useVideoFeed hook for feed data management
- FeedPage with vertical snap-scroll behavior
- Mock video data for development

---

## Phase 3 — Layout Shell, Routing, and UserContext
**Commit:** `a09f92c` | **Status:** Shipped

- AppRouter with protected routes (onboarding gate)
- UserContext with districts, votedQuestionIds, localStorage persistence
- TopNav with logo mode and back-button mode
- BottomNav with four tabs and gold active state
- AppShell wrapper for in-app views
- LandingPage ported from wireframe HTML (full responsive layout)
- OnboardingPage with basic address input and district resolution
- Route structure: landing, onboarding, /app/* protected tree

---

## Phase 2 — Primitive Components
**Commit:** `79ae44a` | **Status:** Shipped

- Logotype with gold period at any size
- GoldRule horizontal divider
- MonoText wrapper for IBM Plex Mono
- Tag with 5 color variants
- StatusPill (unclaimed/claimed)
- Avatar with initials, square, dashed/solid border states
- ScanlineOverlay for dark video backgrounds
- PlusOneButton with all 3 states (default/voted/answered)
- EmDash for absent data display

---

## Phase 1 — Foundation
**Commit:** `cad6edc` | **Status:** Shipped

- Vite + React 19 + TypeScript 5.9 scaffold
- CSS token system: tokens.css, reset.css, typography.css, textures.css, animations.css, global.css
- Full domain type definitions (District, Candidate, Video, Question, DebateChain)
- DataService interface with swappable implementations
- Mock data service for all screens
- PWA manifest with placeholder icons
- Vitest + React Testing Library + Playwright configuration
- ESLint with TypeScript rules

---

## Initial Commit — Project Context and Wireframes
**Commit:** `07dff2f` | **Status:** Shipped

- rep_project_context.md (full product spec)
- CLAUDE.md (project instructions)
- ARCHITECTURE.md (component architecture + build sequence)
- 7 pixel-perfect wireframe HTML files (brand, landing, video, +1, answer jump, profiles, empty states)
