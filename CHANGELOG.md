# Rep. — Changelog

> What shipped and when. Newest entries first.
> Each entry corresponds to a git commit or logical milestone.

---

## [0.14.0] - 2026-04-17 — Google Civic voterInfoQuery Integration (commits 1-3)

### Added
- New Supabase Edge Function `proxy-voterinfo` that calls Google Civic `voterInfoQuery`, maps district scopes to OCD-style codes, upserts `districts` + `candidates` with an enrich-only merge (never overwrites baseline identity fields), and caches responses in `voterinfo_cache` keyed by sha256 address hash.
- `districtCode.ts` helper module in the Edge Function: maps every `voterInfoQuery` scope (`national`, `statewide`, `congressional`, `stateUpper`, `stateLower`, `countywide`, `cityWide`, `cityCouncil`/`ward`, `countyCouncil`, `judicial`, `schoolBoard`) to canonical codes matching existing Geocodio output (`STATE:GA-CD:5`, `COUNTY:GA-FULTON-COMMISSION:4`, etc.). Full unit coverage.
- `normalize.ts` Deno mirror of the shared `src/utils/normalizeName.ts` — canonical name normalizer now has three synced copies (Node, Deno, plpgsql) guarded by a parity test.
- Schema migration `20260416000000_voterinfo_integration.sql` adds `phone`, `email`, `photo_url`, `sources[]`, `google_person_id`, `normalized_name`, `needs_manual_dedup` to `candidates`; `scope`, `external_id`, `source` to `districts`; and the `voterinfo_cache` table. Partial unique index `(normalized_name, district_code) WHERE needs_manual_dedup = false` enables dedup across Google + baseline sources. Reuses existing `campaign_url` column (does not add `candidate_url`).
- `DataService.getBallotForAddress(address)` interface method returning `{ source: 'google' | 'fallback', districts, electionName?, electionDate? }`. `SupabaseDataService` invokes `proxy-voterinfo` and falls back to `resolveDistricts` when Google returns no active election.
- `OnboardingPage` now calls `getBallotForAddress` instead of `resolveDistricts`. When `source === 'google'`, renders a gold monospace election headline (`YOUR MAY 19, 2026 · GEORGIA PRIMARY BALLOT`) above the counter. Counter label drops "state and federal" qualifier when the payload includes local races.
- `src/services/googleCivic.types.ts` — typed Google Civic response shapes for the service layer.

### Rollout
- Commits 1-3 of a five-commit plan are shipped. Commit 4 (admin dedup UI + pg_cron cache cleanup + observability logs) and commit 5 (FEC retirement, gated on post-primary 2026-05-19) are follow-ups.
- `GOOGLE_CIVIC_API_KEY` secret must be set via `supabase secrets set` before the Edge Function becomes functional in production.

---

## [0.13.2] - 2026-04-09 — Bot Identification Page

### Added
- BotPage at `/bot` — public route documenting Rep.'s data import bot. Lists the public sources read (Congress.gov, FEC, OpenStates, Ballotpedia), shows the User-Agent string outbound requests carry, and provides a contact email (getrep.org@gmail.com) for source operators with questions or concerns. Required prerequisite for B1-20 (Ballotpedia challenger scraping) so the scraper can identify itself politely and provide a real channel for the upstream to reach us.
- New `src/views/bot/` directory with `BotPage.tsx` and `BotPage.css`.
- Route registered in `AppRouter.tsx` as a public top-level route alongside `/`, `/onboarding`, `/claim`.

---

## [0.13.1] - 2026-04-09 — Address Confirmation + Candidate Data Source Join

### Added
- Address confirmation phase in onboarding: after Geocodio resolves, user sees a confirm screen showing the district list before the cascade reveal. Three variants: GA (confirm/retry), non-GA (Georgia-only guard), undetermined state.
- STATE_NAMES utility (src/utils/stateNames.ts) extracted from civicApi so non-service code can use it without tripping the architecture import guard.
- Congress.gov API integration in data import pipeline (scripts/import/download.ts): fetches sitting GA House + Senate members via /member/GA?currentMember=true. Free tier, authoritative source.
- Source-joining model in scripts/import/transform.ts: Congress.gov supplies sitting federal members, FEC supplies federal challengers (CAND_ICI != 'I'), OpenStates supplies sitting state legislators. Incumbents win dedup ties.
- `isIncumbent` field on ImportCandidate for source tracking.
- `parseCongress()` function in transform.ts handling Senate + House member parsing from congress.gov JSON output.

### Changed
- FEC transform now drops all records with CAND_ICI='I'. FEC retains candidates whose committees remain open even after they leave office (e.g., MTG after her 2025 resignation), so congress.gov is the sole source of truth for sitting federal incumbents.
- scripts/import/seed.ts accepts VITE_SUPABASE_URL as fallback so only SUPABASE_SERVICE_KEY needs to be added for seed runs.
- package.json import scripts use `tsx --env-file=.env` so CONGRESS_API_KEY and SUPABASE_SERVICE_KEY are loaded from .env without needing to inline them.

### Fixed
- Stale incumbent in CD:14 (MTG) no longer appears in candidate list. CD:14 is correctly represented as vacant-seat-with-challengers-only until a replacement is seated.

---

## [0.13.0] - 2026-04-08 — Ballot Page, Skeleton Loading, Feed Refactor

### Added
- Ballot page (/app/ballot): persistent view of all candidates grouped by office level
- Share button on ballot page: Web Share API with clipboard fallback
- "View your ballot" link on You page navigates to /app/ballot
- Skeleton loading during Geocodio resolve phase (resolving → cascade transition)
- Browser autocomplete="street-address" on onboarding input
- CandidateCard component: tappable card with avatar, name, office, status pill, party
- CandidatePanel: scrollable candidate list for feed levels with no videos
- DistrictBrowserPage: hierarchical accordion view with candidates per district
- useScrollCarousel hook: replaces 208-line useSwipeGesture with 37-line native scroll-snap

### Removed
- useSwipeGesture.ts (208 lines of raw pointer event handling)

## [0.12.0.0] - 2026-04-08 — Onboarding Cascade Reveal

### Added
- Onboarding cascade reveal: after address entry, candidates cascade onto screen with staggered animation grouped by office level (federal, state, county, city)
- Candidate counter in hero typography (Playfair Display 700, 64px) showing total ballot count
- BallotCard compact component: identity-only card (avatar, name, office, party)
- useMyBallot hook: fetches and groups candidates by office level using shared fetcher
- getCandidatesByDistricts service method: single .in() query replacing N+1 pattern
- Fixed CTA bar ("See what they are saying") navigates to feed
- Skeleton loading cards with CSS shimmer animation during ballot fetch
- Global prefers-reduced-motion support for all animations
- iOS safe-area-inset-bottom on fixed CTA bar
- Error/empty fallback with retry for cascade phase

### Changed
- OnboardingPage CSS migrated from hardcoded pixels to fluid --rep-* tokens
- useCandidateFeed refactored from Promise.all N+1 to single getCandidatesByDistricts call

---
## Security Fixes + Backend Deployment
**Commit:** pending | **Status:** Shipped

- Migration: security_fixes.sql — 4 SQL-level fixes identified during pre-deploy review
- Dropped blanket "Public read: question_votes" RLS policy (conflicted with per-user policy from B4, leaked all votes)
- REVOKE EXECUTE on increment_plus_one from anon/authenticated (prevented direct RPC vote inflation)
- Secured upgrade_user_profile: added auth.uid() check (prevented cross-user profile overwrite)
- Added DB triggers: increment candidates.question_count on question insert, candidates.video_count on video insert
- submit-question: now requires auth (JWT from Authorization header), derives authorHandle from user_profiles
- vote-question: removed non-atomic fallback path (RPC is deployed, fallback had TOCTOU race)
- civicApi.ts: removed client-side resolveDistricts (VITE_GEOCODIO_API_KEY no longer shipped in bundle)
- useQuestions: submitQuestion now surfaces errors via setError instead of silently swallowing
- UserContext: ensureAnonymousSession now throws on failure, AUTH_ERROR action + authError state field
- Deployed 4 migrations to Supabase (increment_rpc, anonymous_auth, real_auth, security_fixes)
- Deployed 5 Edge Functions (submit-question, vote-question, submit-feedback, proxy-geocodio, claim-candidate)
- All 110 tests pass

---

## Backend Phase B5 — Real Auth + Candidate Claims
**Commit:** pending | **Status:** Shipped

- Migration: candidate_claims table (write-once, UNIQUE on candidate_id), user_profiles gains email + is_anonymous columns
- authService.ts: sendMagicLink (signInWithOtp), updateHandle (pattern validation + unique check), getAuthStatus
- UserContext: AUTH_UPGRADED + HANDLE_UPDATED actions, onAuthStateChange listener for magic link callback
- claim-candidate Edge Function: verifies non-anonymous auth, checks candidate is unclaimed, write-once insert, transitions status to claimed
- YouPage wired to live auth state: shows handle/email/status, magic link upgrade CTA, inline handle editing
- upgrade_user_profile SQL function for anonymous → authenticated transition
- All 110 tests pass

---

## Backend Phase B4 — Anonymous Identity
**Commit:** pending | **Status:** Shipped

- Migration: user_profiles table with auto-create trigger (handle = @voter_<short_id>)
- Enabled anonymous sign-ins in Supabase config
- supabaseClient.ts: ensureAnonymousSession() — signs in anonymously if no session exists
- UserContext: AUTH_READY action hydrates userId, handle, and votedQuestionIds from server
- vote-question Edge Function now derives userId from auth JWT instead of client param
- RLS: question_votes INSERT requires auth.uid() = user_id, SELECT limited to own votes
- user_profiles readable by all, updatable only by owner
- All 110 tests pass

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
