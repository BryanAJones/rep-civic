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
| 52 | Full onboarding flow (multi-step) | in-progress | Skeleton loading + ballot page + share done; map thumbnails planned |
| 59 | Ballot page (/app/ballot) | done | Persistent ballot view, share button (Web Share + clipboard), linked from You page |
| 60 | Skeleton loading during resolve | done | Resolving phase shows skeleton cards while Geocodio runs |

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
| S-8 | Handle reservation policy (block candidate-name squatting) | done | `reserved_handles` table + `BEFORE UPDATE` trigger on `user_profiles.handle`. Seed populates full-name + last-name variants per candidate. Claim holder can always take their own reserved handle. |
| S-9 | Content-Security-Policy headers on HTML responses | done | Added to `public/_headers` alongside existing X-Content-Type-Options / X-Frame-Options. Allowlists self, Supabase (https + wss), Google Fonts, `data:`/`https:` images. |

### Tier 3 — Before Candidate Auth / Claim Flow

| # | Item | Status | Gates |
|---|------|--------|-------|
| S-10 | Claim verification ceremony spec (highest-risk item) | done | v1: self-attestation with email verification required. verification_method + verified_at columns for future ceremony upgrade. |
| S-11 | Separate candidate and constituent auth contexts | done | Anonymous = constituent only. Non-anonymous (email verified) = eligible to claim. |
| S-12 | Server derives candidateId from session on candidate writes | planned | Candidate auth |
| S-14 | Constituent writes require email-verified session | done | `submit-question` + `vote-question` reject `is_anonymous` callers with 403 / `EMAIL_REQUIRED`. Closes the loophole where any device-created anonymous user could vote and ask without identity. Coupled with `questions.asked_by` FK so authored content is now durably tied to a verified user. |
| S-13 | Write-once ownership table on candidate claim | done | candidate_claims table with UNIQUE on candidate_id. One claim per user enforced in Edge Function. |

### Tier 4 — Before Real-Time Voting

| # | Item | Status | Gates |
|---|------|--------|-------|
| S-15 | Rate-limit voteQuestion endpoint | done | `rate_limit_buckets` + `check_rate_limit(user, endpoint, limit, window_seconds)` RPC. vote-question enforces 30 votes/minute per user, returns 429 with `Retry-After`. Nightly cron prunes stale buckets. |
| S-16 | Change PWA to prompt update + no-store on sw.js | done | `registerType: 'prompt'` + `skipWaiting: false` in vite.config. `UpdatePrompt` component surfaces a navy/gold bottom banner with Reload + Later. `/sw.js` Cache-Control tightened from `no-cache` to `no-store`. |

### Tier 5 — Ongoing / Platform-Level

| # | Item | Status | Gates |
|---|------|--------|-------|
| S-17 | Backend proxy for Geocodio API (remove key from client) | done | Solved by proxy-geocodio Edge Function (B3-4). Key is now a Supabase secret. |
| S-18 | Rate-limit question submission | done | submit-question calls `check_rate_limit` (10 submissions/minute per user) before writing. Returns 429 with `Retry-After` header on breach. Shares `rate_limit_buckets` infra from S-15. |
| S-19 | Audit log for candidate state transitions | done | Append-only `audit_log` table with triggers on `candidates.status` changes, `candidate_claims` insert/delete, and `user_profiles.handle` changes. Service-role-only reads (RLS default-deny). 1-year nightly cleanup via pg_cron. Queryable from Supabase dashboard; admin UI is a future iteration. |
| S-22 | Question relevance validation in submit-question Edge Function | deferred | Intentionally paused. Engineering is trivial (keyword/scope check in the Edge Function); the hard part is the content-moderation policy. Revisit when real users surface off-topic spam as feedback. |
| S-23 | Office-level topic map for relevance scoring | deferred | Same reason as S-22. Curating "what counts as on-topic for a state senator" is a product-editorial call we'll make from real submissions, not guesses. |

### Bug Fixes (from security review)

| # | Item | Status | Notes |
|---|------|--------|-------|
| S-20 | Vote rollback: UNVOTE_QUESTION in UserContext on failed vote | done | usePlusOne catch block now dispatches rollback |
| S-21 | candidateId hardcoded to '' in useQuestions.submitQuestion | done | Verified 2026-04-18: `useQuestions(videoId, candidateId)` threads candidateId at both call sites — `FeedPage.tsx:47` and `CandidateProfilePage.tsx:23`. Stale backlog entry from an earlier refactor. |

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
| B1-9 | Candidate data sources decided | done | Congress.gov (federal incumbents) + FEC bulk CSV (federal challengers) + OpenStates bulk CSV (state legislature). Local (city/county) deferred. |
| B1-10 | Download + parse FEC GA candidate CSV | done | GA federal challengers from fec.gov 2026 cycle bulk file. FEC incumbents dropped (stale — retained after resignations). |
| B1-11 | Download + parse OpenStates GA legislator CSV | done | 233 GA state legislators from data.openstates.org |
| B1-12 | Transform script (scripts/import/transform.ts) | done | Joins Congress.gov + FEC + OpenStates into Rep schema; OCD-ID based district codes |
| B1-13 | Seed script (scripts/import/seed.ts) | done | Upserts districts + candidates into Supabase via service_role key |
| B1-14 | District code mapping table | done | Implicit via OCD-ID format — no separate lookup table needed |
| B1-15 | Swap civicApi.ts to Geocodio | done | Geocodio geocode with fields=cd,stateleg. Same OCD-ID district codes. 6 tests pass. |
| B1-16 | Congress.gov federal incumbent source | done | /member/GA?currentMember=true. Authoritative for sitting federal House + Senate. Replaces unreliable FEC CAND_ICI='I' records. Free tier 5000 req/hr. |
| B1-17 | Source-joining model documented | done | Congress.gov = sitting federal incumbents; FEC = federal challengers (CAND_ICI != 'I'); OpenStates = sitting state legislators. See CLAUDE.md "Backend Architecture". |
| B1-18 | Nightly candidate data refresh (GitHub Action) | planned | .github/workflows/refresh-candidates.yml running npm run import:all on schedule. Secrets: CONGRESS_API_KEY, SUPABASE_SERVICE_KEY. Replaces manual re-run. |
| B1-19 | FEC challenger withdrawal detection | idea | FEC keeps challengers active even after they drop out (no status flip). Need a signal (FEC form 2 termination? manual override?) or periodic stale-record pruning. |
| B1-20 | State-level challenger data source (scraper) | standby | Demoted to standby 2026-04-17. Ballotpedia per-race scraping is the free-but-labor-intensive fallback if a future iteration decides statewide year-round local coverage is worth building. Bot identification page (B1-21) + User-Agent string are prerequisites already in place. See future-iteration options matrix in `~/.claude/plans/yes-let-s-plan-out-cuddly-moth.md` Part 2. Bulk paid Ballotpedia CSV ~$500-600 one-time (data@ballotpedia.org) is the cleanest paid alternative. |
| B1-21 | Bot identification page (`/bot`) | done | Public route documenting Rep.'s import bot, sources read, User-Agent string, and contact email (getrep.org@gmail.com). Prerequisite for B1-20 so scrapes carry a real contact channel back to us. |
| B1-22 | Google Civic voterInfoQuery integration | in-progress | Hybrid election-window layer on top of baseline. Commits 1-3 (proxy-voterinfo + getBallotForAddress + onboarding wire-up) done and deployed. Commit 4 now landed: `/admin/dedup` stub gated by `VITE_ADMIN_ENABLED`, nightly pg_cron job `voterinfo-cache-cleanup` (03:07 UTC) purging expired rows, structured observability logs (`cache_hit`, `google_status`, `contests_count`, `duration_ms`) already emitting from the Edge Function. **Commit 5 (FEC retirement) indefinitely deferred** — original plan assumed Google would cover federal challengers year-round, but voterInfoQuery is seasonal (~4-5 months/year). Without a replacement year-round federal-challenger source, retiring FEC would create an off-cycle federal-challenger gap. Keep FEC. |
| B1-23 | Year-round candidate source outreach | superseded | Closed 2026-04-17 without sending. Premise was "free or outreach-negotiable source closes the statewide local gap"; evaluation showed Wikidata is incumbents-only with no challenger or local value-add, and Civic Forge's public repo (github.com/civicfs/civicfs-publicdata) is 2024 precinct results only. Vote Smart paid tiers exceed project budget; user declined Democracy Works outreach. Decision: narrow the goal (accept off-cycle local gap) rather than widen the sources. Research artifacts retained in `scripts/research/` as reference for future iterations. |
| B1-24 | Year-round source selection decision | superseded | Closed with B1-23. Future-iteration options matrix documented in `~/.claude/plans/yes-let-s-plan-out-cuddly-moth.md` Part 2 (Ballotpedia bulk CSV ~$500-600 is the cleanest paid unlock; metro-Atlanta PDF scraping is the free alternative if launch market narrows). |
| B1-25 | Integrate chosen year-round source | superseded | Closed with B1-23/B1-24. Reopen only if a future iteration selects one of the options documented in the plan file. |

## Backend — Phase B6: Self-Onboarding Candidate Claim

Pivot away from exhaustive challenger import: ship with incumbents only and let candidates self-claim via filing-ID verification. Plan + reviews in `~/.gstack/projects/BryanAJones-rep-civic/bajon-master-design-20260504-210125.md`.

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| B6-0 | Phase 0: `_shared/auth.ts` helper + Edge Function test bootstrap | in-progress | Extracts the 30-line auth boilerplate duplicated across 5 Edge Functions. Helper at `supabase/functions/_shared/auth.ts`, Deno tests at `supabase/functions/_shared/auth.test.ts`, `npm run test:edge` script. No existing functions migrated yet; phase 1 is the first consumer. |
| B6-1 | Phase 1: `verify-candidate-claim` Edge Function (federal path) | done | Shipped 2026-05-05 in 0.18.0. Schema (pending_claims with UNIQUE partial index, candidate_registry, audit_pending_claim trigger, expire_stale_pending_claims pg_cron, revoke_candidate_claim RPC) + Edge Function (initiate/finalize dispatch, FEC API client with 24h cache, 10/hr rate limit, social_proof_required branch stub) + UI (multi-step ClaimModal, /app/claim/finalize route, sybil revoke in /admin/dedup). claim-candidate Edge Function deleted (was verification bypass). State/local return 501; phase 4/6 wire those. |
| B6-2 | Phase 2: Empty-state copy + Web Share + dynamic OG image | in-progress | Copy + share landed 2026-05-05. New `ProfileShareButton` (Web Share API + clipboard fallback), calm-dossier rewording across `EmptyVideoGrid` and the profile-page stubs ("[Name] has not posted any videos.", "[Name] has not received any constituent questions yet.", etc.), mono counts via `MonoText`. Remaining: Cloudflare Worker `/og?candidate=[id]` 1200×630 institutional dossier image — separate deploy target, deferred until user signs off on Worker setup. |
| B6-3 | Phase 3: Ballotpedia verification registry scraper | planned | Repurposed B1-20. New `candidate_registry` table (verification-only, separate from `candidates`). Polite UA `RepBot/0.1` already in place. Nightly via existing GitHub Action. |
| B6-4 | Phase 4: State verification path + GA SOS Playwright fallback | planned | Wires `verifyState` two-tier (Ballotpedia first, GA SOS headless scrape on miss). 1h cache on SOS results. Adds Playwright as a runtime dep. |
| B6-5 | Phase 5: Social-handle fallback for candidates without on-file email | planned | **PROMOTED FROM IDEA → PLANNED 2026-05-04 based on audit results.** Email-on-file coverage measured at 43% on a 30-candidate FEC sample (well under 50% threshold). 57% of GA federal active candidates would be unable to self-claim via magic-link alone. Spec: registry-confirmed candidate with no email falls back to social-handle proof — post a verification code from a publicly-associated handle (campaign Twitter, Instagram, campaign-domain website with WHOIS match). Build phase 1 with `social_proof_required` response branch from day one to avoid re-architecting. |
| B6-6 | Email-on-file coverage audit (assignment) | done | Completed 2026-05-04. **Result: 43% coverage on 30-candidate FEC sample (13 with email, 17 without).** No-email skew toward newer filings. Findings + raw data in `~/.gstack/projects/BryanAJones-rep-civic/audit/`. Re-run with real FEC API key (DEMO_KEY hit rate limit) to confirm at larger sample. |
| B6-7 | Migrate remaining Edge Functions to `_shared/auth.ts` + `_shared/rateLimit.ts` | done | Migrated 2026-05-05. submit-question, vote-question, submit-video-answer now use `requireVerifiedUser` and `checkRateLimit`. New `_shared/rateLimit.ts` extracts the check_rate_limit RPC call so the four authed functions don't reimplement it. proxy-geocodio and proxy-voterinfo skipped — they don't gate on email-verified users (different auth model). |
| B6-8 | Local self-claim (county/city/school board) | planned | **Promoted from idea → planned 2026-05-04 by user direction.** Local races have no canonical filing registry and aren't ingested at all off-cycle. Self-claim therefore requires (a) bootstrap-claim mode where the candidate creates their own candidate row, plus (b) identity verification without a filing-ID lookup. Verification candidates: campaign-domain email magic link (possession of `sarah@sarahsmithforcouncil.com`), DNS TXT record verification on the campaign domain, or verified-social-handle proof reusing phase 5 infra. Needs its own design pass — open as B6-8a/b/c sub-tasks tomorrow. Sequence: ship phase 1-5 first (federal + state); local lands as a phase 6 follow-on once the bootstrap-claim UX is designed. |
| B6-9 | Ballotpedia outreach about verification scraping | idea | One-line email to data@ballotpedia.org describing verification-only use case. UA + bot page already in place. |
| B6-10 | Custom SMTP for magic-link sends | planned | Default Supabase sender caps at ~4 emails/hr project-wide — fine for dev, blocks real claimants. Configure SendGrid/Resend/AWS SES under Auth → SMTP Settings. Code already surfaces `OTP_RATE_LIMIT` distinctly (429 + code) so the modal copy gracefully degrades while waiting. Required before any real candidate self-claim attempt. |
| B6-11 | Fix seed-test-claim idempotency | done | Shipped 2026-05-12. Replaced `upsert(..., { onConflict: 'filing_id' })` with explicit lookup → update existing row by id (preserves FK references) or insert with deterministic `TEST_CANDIDATE_ID = '00000000-0000-4000-8000-000000000001'` on fresh seeds. Test profile URL is now stable across cleanup → reseed cycles. |
| B6-12 | Diagnose mobile claim "non-2xx" repro | in-progress | Shipped client-side error capture 2026-05-12 to unblock the next repro. New `src/utils/claimErrorLog.ts` reads the FunctionsHttpError `context.response` body, persists a 10-entry ring buffer to localStorage, and writes to `console.error`. `ClaimModal` and `ClaimFinalizePage` both now wrap their service calls and expose a "Copy diagnostics" button on the error step so a user on mobile (no DevTools) can paste the captured payload into feedback. Also fixed the pre-existing `errorToCopy` bug that read non-existent `context.status` / `context.body.code` properties (so non-2xx errors fell through to generic copy). Waits on the next repro for the actual triage. |

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
| B5-6 | `questions.asked_by` FK + write-gate on email-verified users | done | Migration `20260419010000_questions_asked_by.sql` adds nullable `asked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL` + index. `submit-question` and `vote-question` Edge Functions reject `is_anonymous` callers with 403 + `code: 'EMAIL_REQUIRED'`. Authored questions now persist across devices and survive account deletion (set null, not cascade). No backfill of orphan rows from the anonymous era. |
| B5-7 | Email-gate prompt + pending-intent persistence | done | `EmailGateProvider` + `EmailGateModal` (gold top-border bottom-sheet) render whenever a write throws `EmailRequiredError`. The attempted action persists to localStorage as a `PendingIntent` (vote / submit-question / claim) with 30-min TTL, surviving the magic-link round-trip into a fresh tab. `usePendingIntentRunner` runs once at the `/app` shell after `AUTH_UPGRADED`, replays the action, and clears the intent. Cancelling the modal also clears it. |
| B5-8 | Wired claim CTA on unclaimed candidate profiles | done | `UnclaimedBanner` now renders an "Is this you? Claim this profile" button. Click calls `service.claimCandidate(candidateId)`; on `EmailRequiredError` opens the email gate with a `claim` pending intent. Replaces the abstract `/claim` marketing scaffold as the primary entry point — users claim where they already see who they're claiming. |

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
| 67 | Candidate dashboard | done | `/app/dashboard` route for claimed candidates: inbox of unanswered questions sorted by +1 count, inline video answer upload (mp4/quicktime/webm, 100MB cap, optional caption). Direct client → Supabase Storage upload (RLS-gated by claim ownership) finalized via `submit-video-answer` Edge Function. Linked from You page when a claim exists. |
| 68 | Multi-market expansion (beyond Atlanta) | idea | District types will grow |
| 69 | Candidate verification (official status) | idea | Verify candidates are who they claim; trust signals beyond soft v1 approach |
| 74 | Horizontal swipe: local ↔ federal | done | Swipe gesture to shift feed between district levels (city → county → state → federal) |
| 76 | Unclaimed candidate view as primary voter experience | done | New `ProfileFeedPanel` is the default surface per district level: each candidate card shows top 2 questions with inline +1 vote and an "ask a question" input. Video feed only appears when a candidate has actually posted videos. Batched `getTopQuestionsForCandidates` keeps it to one round-trip per panel. |
| 77 | PWA install instructions | idea | In-app guidance for installing the PWA on iOS and Android; prompt or banner with platform-specific steps |
| 78 | Feedback system (modal + mock storage) | done | FeedbackModal with category tagging (bug/feature/general), available from TopNav, You page, and landing footer |
| 79 | Coming soon / roadmap section on landing page | done | Voter-facing roadmap from backlog planned items with upvote/downvote buttons |
| 80 | Fluid responsive sizing (container query units) | done | clamp() tokens with cqi units for text, spacing, icons, and touch targets |
| 81 | Candidate identity on video cards | done | Denormalized candidateName + candidateOffice displayed on feed cards |
| 82 | Question relevance checks (office-aware validation) | deferred | Paused with S-22/S-23. Revisit when off-topic spam shows up in real feedback. |
| 83 | Office context hint in QuestionInput | idea | Show candidate's officeTitle + district level near input to nudge on-topic questions (client-side, pre-backend) |
| 84 | Editorial seed questions per office level | done | Migration `20260418050000_seed_questions.sql` adds `is_seed` to `questions`, creates `seed_question_templates` keyed by district level (federal/state/county/city), seeds 3 starter questions per level, backfills every existing candidate (963 rows), and adds an AFTER INSERT trigger so newly-imported candidates auto-get seeds. UI shows a gold "SUGGESTED BY REP." badge in the dashboard inbox. Real +1s sort over seeded zeros. |
| 85 | LLM-generated per-candidate question openers | idea | Follow-on to item 84. Use candidate metadata + recent news to generate tailored questions. Higher signal but introduces hallucination risk attached to a real candidate's name — only pursue once we have a tight prompt + verification loop. |
