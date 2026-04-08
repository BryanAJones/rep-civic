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
| 51 | District reveal animation | done | Cascade reveal with staggered animation, grouped by office level |
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
| S-1 | Restrict Geocodio API key to production domain | done | Client-side resolveDistricts removed; all calls go through proxy-geocodio Edge Function. VITE_GEOCODIO_API_KEY removed from .env. |
| S-2 | maxLength on QuestionInput (280) and address input (200) | done | Any deploy |
| S-3 | Guard localStorage against session tokens + validate districts shape | done | Constituent auth |
| S-4 | Deprecate registeredAddress in UserProfile (do not persist server-side) | done | Real backend |
| S-5 | Document authorHandle server-derivation contract | done | Constituent auth |

### Tier 2 — Before Constituent Auth

| # | Item | Status | Gates |
|---|------|--------|-------|
| S-6 | Choose and document session mechanism (magic link vs OAuth) | done | Magic link (signInWithOtp). Anonymous → authenticated upgrade preserves user data. |
| S-7 | Server-side vote deduplication on (userId, questionId) | done | Real-time voting — implemented via ON CONFLICT in vote-question Edge Function (B3-2) |
| S-8 | Handle reservation policy (block candidate-name squatting) | planned | Constituent auth |
| S-9 | Content-Security-Policy headers on HTML responses | planned | Any auth feature |

### Tier 3 — Before Candidate Auth / Claim Flow

| # | Item | Status | Gates |
|---|------|--------|-------|
| S-10 | Claim verification ceremony spec (highest-risk item) | done | v1: self-attestation with email verification required. verification_method + verified_at columns for future ceremony upgrade. |
| S-11 | Separate candidate and constituent auth contexts | done | Anonymous = constituent only. Non-anonymous (email verified) = eligible to claim. |
| S-12 | Server derives candidateId from session on candidate writes | planned | Candidate auth |
| S-13 | Write-once ownership table on candidate claim | done | candidate_claims table with UNIQUE on candidate_id. One claim per user enforced in Edge Function. |

### Tier 4 — Before Real-Time Voting

| # | Item | Status | Gates |
|---|------|--------|-------|
| S-14 | Use SSE over WebSocket for vote count broadcasting | planned | Real-time voting |
| S-15 | Rate-limit voteQuestion endpoint | planned | Real-time voting |
| S-16 | Change PWA to prompt update + no-store on sw.js | planned | Any real users |

### Tier 5 — Ongoing / Platform-Level

| # | Item | Status | Gates |
|---|------|--------|-------|
| S-17 | Backend proxy for Geocodio API (remove key from client) | done | Solved by proxy-geocodio Edge Function (B3-4). Key is now a Supabase secret. |
| S-18 | Rate-limit question submission | planned | Real backend |
| S-19 | Audit log for candidate state transitions | planned | Candidate auth |
| S-22 | Question relevance validation in submit-question Edge Function | planned | Real backend (B3-1) |
| S-23 | Office-level topic map for relevance scoring | planned | Real backend (B3-1) |

### Bug Fixes (from security review)

| # | Item | Status | Notes |
|---|------|--------|-------|
| S-20 | Vote rollback: UNVOTE_QUESTION in UserContext on failed vote | done | usePlusOne catch block now dispatches rollback |
| S-21 | candidateId hardcoded to '' in useQuestions.submitQuestion | planned | Thread candidateId from video through to hook |

## Backend Deployment

| # | Step | Status | Notes |
|---|------|--------|-------|
| D-1 | Push migrations to Supabase (4 files) | done | initial_schema, increment_rpc, anonymous_auth, real_auth + security_fixes |
| D-2 | Deploy Edge Functions (5 functions) | done | submit-question, vote-question, submit-feedback, proxy-geocodio, claim-candidate |
| D-3 | Set GEOCODIO_API_KEY secret | planned | `npx supabase secrets set GEOCODIO_API_KEY=<key>` |
| D-4 | Enable anonymous sign-ins in Supabase Dashboard | planned | Dashboard > Auth > Providers > Anonymous Sign-Ins |
| D-5 | Pre-deploy security fixes (migration) | done | RLS fix on question_votes, REVOKE on increment_plus_one, secure upgrade_user_profile, counter triggers |

---

## Backend — Phase B1: Database Schema + Data Import

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| B1-1 | Create Supabase project (free tier) | done | Project ID: ocpcejomntxqsboswhrx |
| B1-2 | Database migration: districts table | done | code PK, level, office_title, district_name, display_label |
| B1-3 | Database migration: candidates table | done | Discriminated union via status CHECK constraint |
| B1-4 | Database migration: videos, questions, topics, debate chain tables | done | All remaining tables + FKs |
| B1-5 | Database migration: question_votes table | done | Composite PK (user_id, question_id) for dedup |
| B1-6 | Database migration: feedback table | done | Simple insert target |
| B1-7 | RLS policies: public reads on all tables | done | SELECT for anon role |
| B1-8 | Type generation setup (supabase gen types) | done | Auto-generated src/types/supabase.ts |
| B1-9 | Candidate data sources decided | done | FEC bulk CSV (federal) + OpenStates bulk CSV (state legislature). ~465 candidates. Local (city/county) deferred. |
| B1-10 | Download + parse FEC GA candidate CSV | done | 243 GA federal candidates from fec.gov 2026 cycle bulk file |
| B1-11 | Download + parse OpenStates GA legislator CSV | done | 233 GA state legislators from data.openstates.org |
| B1-12 | Transform script (scripts/import/transform.ts) | done | Maps FEC + OpenStates to Rep schema; OCD-ID based district codes |
| B1-13 | Seed script (scripts/import/seed.ts) | done | Upserts districts + candidates into Supabase via service_role key |
| B1-14 | District code mapping table | done | Implicit via OCD-ID format — no separate lookup table needed |
| B1-15 | Swap civicApi.ts to Geocodio | done | Geocodio geocode with fields=cd,stateleg. Same OCD-ID district codes. 6 tests pass. |

## Backend — Phase B2: Read API

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| B2-1 | Supabase client init (src/services/supabaseClient.ts) | done | Anon key + project URL from env vars |
| B2-2 | SupabaseDataService (src/services/supabaseService.ts) | done | Implements DataService for all read methods + temporary client writes |
| B2-3 | Swap service export from mock to real | done | One-line change in src/services/index.ts |
| B2-4 | getFeedVideos with candidate/district joins | done | Multi-query with denormalized candidateName, candidateOffice, districtLevel |
| B2-5 | getDebateChain with nodes + participants | done | Parallel fetch of chain_nodes + chain_participants |

## Backend — Phase B3: Write API (Edge Functions)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| B3-1 | Edge Function: submit-question | done | Server-side insert via service_role, text length validation (280 chars), candidate existence check, auth required (derives handle from user_profiles). Relevance validation (S-22, S-23) deferred. |
| B3-2 | Edge Function: vote-question | done | Insert vote record with ON CONFLICT dedup (solves S-7), atomic increment via increment_plus_one RPC. Fallback path removed; RPC required. |
| B3-3 | Edge Function: submit-feedback | done | Validated insert with category check, text length (2000), email length (254) |
| B3-4 | Edge Function: proxy-geocodio | done | Server-side Geocodio API key via GEOCODIO_API_KEY secret, address length validation (200). Solves S-17. |
| B3-5 | CORS configuration for Edge Functions | done | Uses @supabase/supabase-js/cors built-in corsHeaders. No shared file needed. |

## Backend — Phase B4: Anonymous Identity

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| B4-1 | Enable Supabase anonymous auth | done | signInAnonymously() on app init, session persists via localStorage |
| B4-2 | user_profiles table + auto-create trigger | done | handle auto-generated as @voter_<short_id> on auth.users insert |
| B4-3 | RLS: question_votes INSERT requires auth.uid() match | done | INSERT WITH CHECK + SELECT USING on user_id = auth.uid() |
| B4-4 | Sync UserContext with Supabase auth state | done | AUTH_READY action hydrates userId, handle, votedQuestionIds from server; merges with localStorage cache |

## Backend — Phase B5: Real Auth

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| B5-1 | Constituent auth: magic link (signInWithOtp) | done | authService.ts sendMagicLink, onAuthStateChange listener upgrades anonymous → authenticated |
| B5-2 | Custom handle selection after auth upgrade | done | authService.ts updateHandle with @pattern validation + unique constraint. Edit UI on YouPage. |
| B5-3 | candidate_claims table + claim flow | done | Write-once ownership via claim-candidate Edge Function. Self-attestation verification method. Solves S-13. |
| B5-4 | Candidate status transition on verified claim | done | Edge Function transitions unclaimed → claimed with guard clause |
| B5-5 | Separate candidate/constituent auth contexts | done | Candidates must be non-anonymous (email verified) to claim. Anonymous users are constituents only. Solves S-11. |

---

## Ideas (Not Yet Scoped)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 59 | Candidate claim flow (/claim/:candidateId) | planned | Scoped in Phase B5, ties to candidate auth |
| 60 | District browser page (real content) | idea | Currently a stub |
| 61 | You page (account + districts + feedback) | done | Replaced Reps stub with You tab; account placeholder, district listing, feedback link |
| 62 | Search / discovery | idea | Not yet designed |
| 63 | Notifications | idea | Not yet designed |
| 64 | Settings page | idea | Not yet designed |
| 66 | Real-time +1 via WebSocket/SSE | idea | Supabase Realtime subscriptions; hook-level change only |
| 67 | Candidate dashboard | idea | Not yet designed |
| 68 | Multi-market expansion (beyond Atlanta) | idea | District types will grow |
| 69 | Candidate verification (official status) | idea | Verify candidates are who they claim; trust signals beyond soft v1 approach |
| 70 | PWA hot refresh on updates | idea | Push new content to installed PWA without manual reload; critical for phone installs |
| 73 | Functioning side rail buttons | idea | VideoRightRail buttons wired to real actions (not just counts) |
| 74 | Horizontal swipe: local ↔ federal | done | Swipe gesture to shift feed between district levels (city → county → state → federal) |
| 76 | Unclaimed candidate view as primary voter experience | planned | Pre-auth default: voters see unclaimed profiles with questions and +1 voting; video feed becomes post-auth/post-claim |
| 77 | PWA install instructions | idea | In-app guidance for installing the PWA on iOS and Android; prompt or banner with platform-specific steps |
| 78 | Feedback system (modal + mock storage) | done | FeedbackModal with category tagging (bug/feature/general), available from TopNav, You page, and landing footer |
| 79 | Coming soon / roadmap section on landing page | done | Voter-facing roadmap from backlog planned items with upvote/downvote buttons |
| 80 | Fluid responsive sizing (container query units) | done | clamp() tokens with cqi units for text, spacing, icons, and touch targets |
| 81 | Candidate identity on video cards | done | Denormalized candidateName + candidateOffice displayed on feed cards |
| 82 | Question relevance checks (office-aware validation) | planned | Client hint + server enforcement; reject questions outside candidate's jurisdiction. See S-22, S-23 |
| 83 | Office context hint in QuestionInput | idea | Show candidate's officeTitle + district level near input to nudge on-topic questions (client-side, pre-backend) |
