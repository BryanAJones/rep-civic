# Rep. — Project Instructions

## What This Is

A civic accountability PWA that connects constituents with their elected officials via district-filtered video Q&A. See `rep_project_context.md` for the full product spec.

## Keeping Definition Files in Sync (Mandatory)

Every code change that adds, removes, or modifies features, routes, components, types, hooks, or architectural patterns **must** include updates to the relevant definition files in the same commit. Do not treat documentation updates as a separate follow-up task — they are part of shipping the work.

### Files and when to update them

| File | Update when... |
|------|---------------|
| `CLAUDE.md` | New routes added/removed, new architectural patterns introduced, tech stack changes, new conventions established, "What's Built" status changes |
| `ARCHITECTURE.md` | New components/views/hooks added to the tree, data model changes, service layer changes, routing changes, CSS architecture changes |
| `BACKLOG.md` | Any feature ships (`done`), starts (`in-progress`), gets scoped (`planned`), or is proposed (`idea`). Also update the Security section for security-related changes |
| `CHANGELOG.md` | Any feature or fix ships — add entry with commit hash and details |
| `src/data/changelog.ts` | User-facing features ship — add concise entry to the top of the array |

### Checklist (run mentally before every commit)

1. Did I add a new route? Update `CLAUDE.md` routes table and `ARCHITECTURE.md` routing section.
2. Did I add new components, hooks, or views? Update the `ARCHITECTURE.md` project structure tree.
3. Did I ship a feature or fix a bug? Update `BACKLOG.md` status, add `CHANGELOG.md` entry, and if user-facing add to `src/data/changelog.ts`.
4. Did I introduce a new pattern (e.g., new CSS convention, new hook pattern, new state shape)? Document it in the relevant `CLAUDE.md` section.
5. Did I change the data model or service interface? Update `ARCHITECTURE.md` sections 3 and 5.
6. Did I change what's built vs. planned? Update the "What's Built" section in `CLAUDE.md`.

## Tech Stack

- **Platform:** Progressive Web App (PWA) — not native. Chosen for fast prototyping, reuse of existing HTML/CSS artifacts, and no app store account dependency.
- **Framework:** Vite + React + TypeScript
- **PWA tooling:** vite-plugin-pwa (Workbox under the hood)
- **Styling:** CSS — the brand system is already defined in plain CSS across the wireframe files. Preserve it. No Tailwind, no CSS-in-JS unless explicitly discussed.
- **Fonts:** Google Fonts — Playfair Display, IBM Plex Sans, IBM Plex Mono (already imported in all wireframe files)
- **API:** Geocodio API for district resolution from address (free tier, 2500/day; will be proxied through Supabase Edge Function in B3)
- **Backend:** Supabase (Postgres + Auth + Edge Functions). Supabase client for reads (with RLS), Edge Functions for all writes. See "Backend Architecture" section below.
- **Database:** PostgreSQL via Supabase. Migrations in `supabase/migrations/`. Type generation via `supabase gen types typescript`.
- **Auth (planned):** Supabase Auth — anonymous first (device-based), then magic link upgrade to real accounts.
- **State management:** React Context + `useReducer` (UserContext, FeedContext). No Redux/Zustand.
- **Testing:** Vitest + React Testing Library (unit), Playwright + axe-core (e2e + a11y)

## Design Reference Files

The `*.html` files in this directory are the **pixel-accurate design references**. They are complete, standalone HTML/CSS documents — not templates or components. When building React components, match these files visually.

| File | What it defines |
|------|----------------|
| `rep_brand.html` | Full brand system — logo, palette, type scale, voice, UI components, onboarding |
| `rep_landing.html` | Landing page (production-ready, responsive at 720px breakpoint) |
| `rep_video_revised.html` | **Definitive** video feed + questions drawer screens |
| `rep_plus_one.html` | +1 button mechanic — all three states with anatomy |
| `rep_answer_jump.html` | Answered question → answer video jump + back nav + question banner |
| `unclaimed_profile_wireframes.html` | Unclaimed profile, notification email, claimed profile |
| `rep_empty_states.html` | Empty states: unclaimed with topic cards + claimed with empty video grid |

## Brand Rules (Non-Negotiable)

These are identity-level decisions. Do not deviate.

- **"Rep."** always has a gold period (`#B8922A`). The period is structural, not decorative.
- **Squared corners everywhere** — 2px border-radius max. No rounded corners.
- **Gold rule line** (1px, `#B8922A`) between nav and content on every screen.
- **Scan-line texture** on dark video backgrounds (subtle `repeating-linear-gradient`).
- **No emoji anywhere in the UI.** The tone is institutional, not casual.
- **No exclamation marks** in UI copy. Declarative sentences only.
- **Em dash (—) not zero** for absent data on unclaimed/empty profiles. Zero implies activity; dash signals absence.

### Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Navy | `#0D1F3C` | Headers, buttons, dark backgrounds |
| Blue | `#1A4A7A` | Secondary blue |
| Blue mid | `#2E6AAF` | Links, interactive tags |
| Blue light | `#E8F0F9` | Tag backgrounds |
| Gold | `#B8922A` | Period in "Rep.", accents, +1 voted state, unclaimed warnings |
| Mist | `#EEF1F6` | Page backgrounds |
| Cream | `#F7F5EF` | Section backgrounds |
| White | `#FAFBFC` | Card backgrounds |
| Rule | `#D1D9E6` | Borders, dividers |
| Ink | `#1A1C22` | Body text |
| Steel | `#4A5568` | Secondary text |
| Green | `rgba(100,180,140,0.75)` | Answered/active states |

### Typography

| Use | Font | Weights |
|-----|------|---------|
| Display / headings | Playfair Display | 700 display, 500 headings, 400i subheads |
| UI / body / labels | IBM Plex Sans | 600 labels (uppercase, tracked), 400 body, 300 large descriptive |
| Data / IDs / monospace | IBM Plex Mono | Filing IDs, counts, district codes, source citations |

## Coding Conventions

- **TypeScript strict mode.** No `any` unless truly unavoidable.
- **Functional React components only.** No class components.
- **File naming:** `PascalCase.tsx` for components, `camelCase.ts` for utilities, `kebab-case.css` for stylesheets.
- **CSS:** Use CSS custom properties for the color palette and type scale. Define them once in `tokens.css`, reference everywhere.
- **Fluid sizing:** Use the `--rep-text-*`, `--rep-space-*`, `--rep-icon-*`, and `--rep-touch-*` tokens which use `clamp()` with container query units (`cqi`). Do not hardcode pixel sizes for text, spacing, icons, or touch targets in components — use these tokens.
- **No premature abstraction.** Build the specific thing first. Generalize only when a real second use case appears.
- **Mobile-first.** All layouts start at ~375px and scale up. The primary breakpoint is 720px (matching the landing page).

## Testing Conventions

- **Unit tests** live next to the code they test: `Component.test.tsx` beside `Component.tsx`.
- **Test setup** at `src/test/setup.ts` — polyfills ResizeObserver, mocks localStorage, clears storage after each test.
- **Test utilities** at `src/test/test-utils.tsx` — re-exports RTL with UserProvider wrapper. Use `import { render } from '../test/test-utils'` in component tests.
- **Mock data** at `src/test/mock-data.ts` and `src/test/mock-service.ts` — shared test fixtures and mock DataService.
- **E2e tests** in `e2e/` — Playwright specs for accessibility (axe-core), feed, and onboarding.
- **Validate before deploy:** Run `npm run validate` (tsc + eslint + vitest) as a gate.

## Current Routes

```
/                           LandingPage (public)
/onboarding                 OnboardingPage (public)
/claim                      ClaimPage (public, scaffold only)
/app/*                      ProtectedApp (requires completed onboarding)
  /app/feed                 FeedPage (default tab, vertical snap-scroll + horizontal swipe)
  /app/feed/video/:videoId/answer/:answerId   AnswerVideoPage
  /app/districts            DistrictBrowserPage (stub)
  /app/you                  YouPage (account, districts, feedback)
  /app/profile/:candidateId CandidateProfilePage
  /app/chain/:chainId       DebateChainPage
```

Note: The "Reps" tab was replaced by "You" tab. QuestionsDrawerPage is now an inline drawer on FeedPage, not a separate route.

## What's Built (Phases 1-11)

The prototype is functional with mock data. All phases through 11 are shipped or partially shipped.

**Built and working:**
- Foundation: Vite + React 19 + TS scaffold, CSS tokens, domain types, DataService + mock implementation, PWA manifest
- Primitives: Logotype, GoldRule, MonoText, Tag, StatusPill, Avatar, ScanlineOverlay, PlusOneButton (3 states), EmDash
- Layout: AppRouter with protected routes, UserContext (useReducer + localStorage), TopNav, BottomNav, AppShell
- Landing page: Full port from wireframe HTML, collapsible changelog, candidate entry section, roadmap section
- Video feed: Snap-scroll vertical feed, district-level horizontal swipe navigation (city/county/state/federal/all)
- Questions: Drawer overlay, +1 voting with optimistic update + rollback, question input, question context banner
- Answer video: Full-screen answer view with back nav to questions
- Candidate profiles: 3-state rendering (unclaimed/claimed/active), tabs (Videos/Q&A/Positions), empty states
- Empty states + topics: TopicCard, GeneralQuestionBox, distributed empty-state prompts
- Debate chains: buildChainTree graph utility, recursive tree rendering, respond chips
- Onboarding: Address input with real Google Civic API integration
- PWA: dvh audit, iOS/Android meta tags, production icons (192 + 512), Lighthouse 95/100/100
- You page: Account placeholder, district listing, feedback link (replaced Reps tab)
- Feedback system: Modal with category tagging (bug/feature/general)
- Claim page: Basic claim flow scaffold at /claim

**Partially built (planned items remain):**
- Onboarding: District reveal animation, multi-step flow
- PWA: Custom Workbox caching strategies, offline fallback behavior
- Security: Tier 1 partially done; Tiers 2-5 planned (see BACKLOG.md Security section)

**Not yet designed:** Candidate dashboard, full onboarding flow, notifications, settings, search/discovery

## Backlog and Changelog

Three files track what's built and what's next (see also "Keeping Definition Files in Sync" above for the full update policy):

1. **`BACKLOG.md`** — The feature backlog. Every feature has a status (`done`, `in-progress`, `planned`, `idea`), a category, and a notes column. Internal planning document.
2. **`CHANGELOG.md`** — Detailed record of what shipped, organized by phase. Includes commit hashes and bullet-point descriptions. Dev-facing.
3. **`src/data/changelog.ts`** — TypeScript data file that drives the "Development log" section on the landing page. User-facing, concise.

### Shipping checklist (backlog-specific):

1. Update `BACKLOG.md` — set completed items to `done`, move in-progress items forward
2. Add an entry to `CHANGELOG.md` with commit hash and details
3. Add an entry to the top of the `changelog` array in `src/data/changelog.ts` (newest first)
4. Increment the version string (0.1, 0.2, ... matching the phase number loosely)

### Adding new feature ideas:

- Add to the "Ideas" section at the bottom of `BACKLOG.md` with status `idea`
- Only promote to `planned` when scope and phase are determined

### Tone:

- Declarative, institutional (no emoji, no exclamation marks — same as the rest of the brand)
- User-facing in `src/data/changelog.ts`, dev-facing in `CHANGELOG.md`
- Keep landing page entries to 3-5 bullets per version

## Feed Architecture

The video feed uses a horizontal swipe carousel to switch between district levels:

- **FeedPage** — owns the `useSwipeGesture` hook and renders a `LevelTabStrip` + carousel of `FeedPanelConnected` panels.
- **FeedPanelConnected** — wires a district level to `FeedPanel` via `useVideoFeed(level)`.
- **FeedPanel** — stateless: receives videos array, renders vertical snap-scroll `VideoCard` list.
- **LevelTabStrip** — animated label + dot indicators synced to swipe `progress` value.
- **useSwipeGesture** — raw pointer event handler with axis locking, rubber-band edges, velocity snap. Returns `{ activeIndex, offset, progress, handlers }`.

Per-level scroll positions are preserved when swiping between levels. Empty levels are auto-skipped based on the user's districts.

## Backend Architecture

**Stack:** Supabase (Postgres + Auth + Edge Functions) on the free tier.

**Key principle:** Supabase client for reads (with Row Level Security), Edge Functions for all writes. No component should ever write to the database directly from the client.

**Phased rollout (B1-B5):**

| Phase | What ships | Status |
|-------|-----------|--------|
| B1 | Database schema, migrations, FEC + OpenStates data import, Geocodio swap | done |
| B2 | Real read queries via `SupabaseDataService`, swap out mock | done |
| B3 | Edge Functions for writes (questions, votes, feedback, Geocodio proxy) | planned |
| B4 | Anonymous auth (device-based identity, vote dedup) | planned |
| B5 | Magic link auth (constituents), candidate claim flow | planned |

**Service layer swap:** The `DataService` interface in `src/services/dataService.ts` is the contract. The swap happens in `src/services/index.ts` — change the export from `mockService` to `supabaseService`. No other files change.

**New backend files (when built):**
- `supabase/migrations/` — SQL migration files
- `supabase/functions/` — Edge Functions (Deno)
- `src/services/supabaseClient.ts` — client init
- `src/services/supabaseService.ts` — implements DataService
- `src/types/supabase.ts` — auto-generated from schema
- `scripts/import/` — FEC + OpenStates data download/transform/seed scripts

**GA candidate data:** FEC bulk CSV (federal House + Senate candidates) and OpenStates bulk CSV (current state legislators). Downloaded via `npm run import:download`, transformed via `npm run import:transform`, seeded via `npm run import:seed`. District codes use OCD-ID format (`STATE:GA-CD:5`, `STATE:GA-SLDL:60`, `STATE:GA-SLDU:34`) matching Geocodio output. Scripts in `scripts/import/`, run manually by the developer.

**District resolution:** Geocodio geocode API with `fields=cd,stateleg`. Replaces Google Civic Information API (shut down April 2025). Same OCD-ID based district codes. Free tier: 2,500 lookups/day.

**Environment variables (when backend is active):**
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anonymous/public key
- `VITE_GEOCODIO_API_KEY` — Geocodio API key (free tier, 2500/day; moves to Edge Function secret in B3)

## Key Product Decisions

- Constituents ask text questions only. Officials/candidates post video.
- Every video has its own independent question section (not per-candidate globally).
- Questions sorted by +1 count descending.
- Debate chains: 2 responses per candidate per chain, any same-race candidate can enter.
- Unclaimed profiles auto-generated from public filings — the core go-to-market mechanic.
- No verification in v1 — soft trust signals only.
- Launch market: Atlanta, GA.
