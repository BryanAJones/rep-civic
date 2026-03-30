# Rep. — Architecture Blueprint

> Comprehensive architecture reference for the Rep. PWA. Generated from analysis of all wireframes and the project context document.

---

## 1. Project Structure

```
/src
  /assets
    /fonts          (empty — loaded from Google Fonts CDN)
    /icons          (any SVG icons extracted from wireframes)
  /styles
    tokens.css      (single source of truth for all CSS custom properties)
    reset.css       (box-sizing, margin, padding reset)
    typography.css  (font-face imports, type utility classes)
    textures.css    (scan-line, diagonal-stripe utilities)
    animations.css  (transitions, spring presets)
    global.css      (body defaults, ::selection, focus ring)
  /types
    domain.ts       (all TypeScript interfaces — see Section 3)
    api.ts          (API response shapes — Geocodio + future backend)
    supabase.ts     (auto-generated from Supabase schema via supabase gen types)
    ui.ts           (UI-only types: tab names, drawer states, toast variants)
  /services
    civicApi.ts     (Geocodio API client — district resolution from address)
    dataService.ts  (abstract data layer — see Section 5)
    mockData.ts     (static mock data for all screens during dev)
  /hooks
    useUserDistricts.ts
    useVideoFeed.ts
    useQuestions.ts
    usePlusOne.ts
    useCandidateProfile.ts
    useQuestionDrawer.ts
    useDebateChain.ts
    useOnboarding.ts
  /context
    UserContext.tsx         (current user, districts, auth state)
    FeedContext.tsx          (active video index, feed data)
  /components
    /primitives
      Logotype.tsx
      GoldRule.tsx
      StatusPill.tsx
      Tag.tsx
      MonoText.tsx
      PlusOneButton.tsx
      ScanlineOverlay.tsx
      Avatar.tsx
      VideoThumbnail.tsx
      EmDash.tsx
    /layout
      AppShell.tsx
      TopNav.tsx
      BottomNav.tsx
      PageContainer.tsx
    /video
      VideoPlayer.tsx
      VideoOverlay.tsx
      VideoRightRail.tsx
      VideoCaption.tsx
      VideoTag.tsx
      VideoCard.tsx
    /questions
      QuestionDrawer.tsx
      QuestionRow.tsx
      QuestionInput.tsx
      VideoThumbBar.tsx
      QuestionContextBanner.tsx
    /profile
      ProfileHeader.tsx
      ProfileStats.tsx
      ProfileTabs.tsx
      UnclaimedBanner.tsx
      PositionsList.tsx
      VideoGrid.tsx
      EmptyVideoGrid.tsx
    /topics
      TopicCard.tsx
      GeneralQuestionBox.tsx
    /chain
      DebateChain.tsx
      ChainNode.tsx
      ChainRespondChips.tsx
  /views
    /landing
      LandingPage.tsx
    /onboarding
      OnboardingPage.tsx
    /feed
      FeedPage.tsx
      QuestionsDrawerPage.tsx
      AnswerVideoPage.tsx
    /profile
      CandidateProfilePage.tsx
    /districts
      DistrictBrowserPage.tsx
    /reps
      RepsPage.tsx
  /router
    AppRouter.tsx
    routes.ts
  main.tsx
  App.tsx
/public
  manifest.webmanifest
  icon-192.png
  icon-512.png
  /screenshots
vite.config.ts
tsconfig.json
tsconfig.app.json
/supabase
  /migrations
    20260328015705_initial_schema.sql  (11 tables, indexes, RLS, triggers)
/scripts
  /import
    download.ts     (fetches FEC zip + OpenStates CSV to data/)
    transform.ts    (maps raw data to Rep schema JSON)
    seed.ts         (upserts districts + candidates into Supabase)
    types.ts        (intermediate types for import pipeline)
    /data           (gitignored — raw CSVs and transformed JSON)
```

---

## 2. Component Architecture

### Shared Primitives

**`Logotype.tsx`** — Renders `Rep<span className="period">.</span>` at any size. Props: `size` (numeric px or predefined scale key), `onDark` (boolean, controls text color). The gold period color is unconditional and comes from `--rep-gold` always.

**`PlusOneButton.tsx`** — Three visual states driven by a `state` prop typed as `'default' | 'voted' | 'answered'`. In `answered` state it renders the green checkmark column instead of the +1 mark. The count is always displayed below. In `answered` state the entire parent row becomes tappable and the component emits an `onWatchReply` callback instead of `onVote`. The 44px fixed width is part of this component's contract.

**`StatusPill.tsx`** — Props: `variant: 'unclaimed' | 'claimed'`. Renders the gold or green pill with correct borders and backgrounds.

**`Avatar.tsx`** — Props: `initials: string`, `variant: 'unclaimed' | 'claimed'`. Unclaimed renders dashed border with muted background, claimed renders solid navy 2px-radius square. Square element, not circle.

**`ScanlineOverlay.tsx`** — A `position: absolute; inset: 0; pointer-events: none` div with the scan-line gradient as a `::before`. Used as a child of any dark video container.

**`MonoText.tsx`** — Wraps any IBM Plex Mono string. Props: `size`, `opacity`. Used for district codes, filing IDs, counts, usernames.

**`Tag.tsx`** — Props: `variant: 'blue' | 'gold' | 'navy' | 'mist' | 'green'`, `label: string`. Squared corners (2px). Uppercase tracked label text.

**`GoldRule.tsx`** — A 1px horizontal line in `--rep-gold`. Used as the border between nav and content on every screen.

**`EmDash.tsx`** — Renders an em dash character with correct muted styling. Used wherever stats are undefined on unclaimed/empty profiles.

### Layout Components

**`TopNav.tsx`** — Props: `contextString?: string`, `backLabel?: string`, `onBack?: () => void`. Navy bar with gold rule border. Logo mode vs. back-button mode.

**`BottomNav.tsx`** — Props: `activeTab: 'feed' | 'districts' | 'ask' | 'reps'`. Four tabs, gold active state, gold rule top border.

**`AppShell.tsx`** — Wraps all in-app views. Renders TopNav, content area, BottomNav. Landing page and onboarding bypass this shell.

### Screen-Level Compositions

**`FeedPage.tsx`** — Vertical-swipe video feed with virtualized list. Opens questions drawer overlay.

**`QuestionsDrawerPage.tsx`** — Overlays the feed. VideoThumbBar at top, scrollable QuestionRow list, QuestionInput pinned at bottom.

**`AnswerVideoPage.tsx`** — Full-screen video with QuestionContextBanner at top, back button returns to questions drawer.

**`CandidateProfilePage.tsx`** — Three tabs, content conditional on `candidate.status: 'unclaimed' | 'claimed-no-videos' | 'claimed-active'`.

---

## 3. Data Model (TypeScript Interfaces)

```typescript
// Core identifiers
type DistrictCode = string;   // e.g., "GA-SEN-D40", "ATL-SB-D6"
type FilingId = string;       // e.g., "GA SOS #0044821"
type UserId = string;
type CandidateId = string;
type VideoId = string;
type QuestionId = string;
type ChainId = string;

// District resolution from Google Civic API
interface District {
  code: DistrictCode;
  level: 'city' | 'county' | 'state' | 'federal';
  officeTitle: string;
  districtName: string;
  displayLabel: string;
  candidateIds: CandidateId[];
}

interface UserProfile {
  id: UserId;
  handle: string;
  registeredAddress: string;
  districts: District[];
  votedQuestionIds: QuestionId[];
}

// Candidate — three possible states (discriminated union)
type CandidateStatus = 'unclaimed' | 'claimed' | 'active';

interface CandidateBase {
  id: CandidateId;
  name: string;
  initials: string;
  officeTitle: string;
  districtCode: DistrictCode;
  party: string;
  status: CandidateStatus;
}

interface UnclaimedCandidate extends CandidateBase {
  status: 'unclaimed';
  filingId: FilingId;
  filingDate: string;
  campaignUrl?: string;
  opponentCount: number;
  questionCount: number;
}

interface ClaimedCandidate extends CandidateBase {
  status: 'claimed';
  videoCount: 0;
  questionCount: number;
  positions: string[];
}

interface ActiveCandidate extends CandidateBase {
  status: 'active';
  videoCount: number;
  answeredQuestionCount: number;
  responseRate: number;
  positions: string[];
}

type Candidate = UnclaimedCandidate | ClaimedCandidate | ActiveCandidate;

// Video post types
type VideoPostType = 'statement' | 'response-to-opponent' | 'qa-reply';

interface Video {
  id: VideoId;
  candidateId: CandidateId;
  postType: VideoPostType;
  caption: string;
  thumbnailUrl: string;
  videoUrl: string;
  reactionCount: number;
  questionCount: number;
  publishedAt: string;
  answersQuestionId?: QuestionId;
  chainId?: ChainId;
  chainDepth?: number;
}

// Questions
type QuestionState = 'default' | 'voted' | 'answered';

interface Question {
  id: QuestionId;
  videoId?: VideoId;
  topicId?: string;
  candidateId: CandidateId;
  text: string;
  authorHandle: string;
  plusOneCount: number;
  state: QuestionState;
  answerVideoId?: VideoId;
  createdAt: string;
}

// Auto-generated topic cards (unclaimed profiles)
interface Topic {
  id: string;
  candidateId: CandidateId;
  title: string;
  sourceBadge: string;
  questions: Question[];
}

// Debate chains
interface ChainParticipant {
  candidateId: CandidateId;
  responsesUsed: number;
  responsesAllowed: 2;
}

interface ChainNode {
  videoId: VideoId;
  candidateId: CandidateId;
  parentVideoId?: VideoId;
  depth: number;
}

interface DebateChain {
  id: ChainId;
  districtCode: DistrictCode;
  topicLabel: string;
  openedAt: string;
  nodes: ChainNode[];
  participants: ChainParticipant[];
  totalQuestions: number;
}
```

---

## 4. State Management

**React Context + `useReducer`** for shared state, local `useState` for component-scoped state. No Redux/Zustand until complexity demands it.

**UserContext** holds: `userProfile`, `districts`, `hasCompletedOnboarding`, `votedQuestionIds: Set<QuestionId>`. The voted set is cross-cutting — must be consistent whether a question appears in the feed drawer or the profile Q&A tab. Persisted to `localStorage`.

**FeedContext** holds: `activeVideoIndex`, `feedVideos`, `activeDrawerVideoId`.

**Local state:** Input values, tab selection, drawer open/closed, topic card expanded/collapsed.

**Hooks** manage loading/error/data tuples. Example: `useQuestions(videoId)` returns `{ questions, loading, error, submitQuestion, voteQuestion }`. Hooks call the service layer — they don't know whether data comes from a mock or real API.

**Optimistic updates:** `usePlusOne` must optimistically update count and votedQuestionIds, then roll back on error. Design this from day one.

**localStorage persistence:** `votedQuestionIds`, `hasCompletedOnboarding`, `districts`.

---

## 5. Service Layer

A typed interface with swappable implementations — mock for dev, real backend later.

```typescript
interface DataService {
  resolveDistricts(address: string): Promise<District[]>;
  getFeedVideos(districtCodes: DistrictCode[], filter?: DistrictLevel): Promise<Video[]>;
  getQuestionsForVideo(videoId: VideoId): Promise<Question[]>;
  getQuestionsForCandidate(candidateId: CandidateId): Promise<Question[]>;
  submitQuestion(candidateId: CandidateId, videoId: VideoId | null, text: string, topicId?: string): Promise<Question>;
  voteQuestion(questionId: QuestionId): Promise<{ newCount: number }>;
  getCandidate(candidateId: CandidateId): Promise<Candidate>;
  getCandidatesForDistrict(districtCode: DistrictCode): Promise<Candidate[]>;
  getTopicsForCandidate(candidateId: CandidateId): Promise<Topic[]>;
  getDebateChain(chainId: ChainId): Promise<DebateChain>;
  getVideo(videoId: VideoId): Promise<Video>;
  getVideosForCandidate(candidateId: CandidateId): Promise<Video[]>;
}
```

**Implementations:**

**`mockData.ts`** — Complete static implementation matching wireframe content. Used during development and as the test double.

**`supabaseService.ts`** — Real implementation backed by Supabase. Reads use the Supabase client with RLS. Writes are temporary client-side inserts until Edge Functions (B3).

**`supabaseClient.ts`** — Initializes the Supabase client with anon key and project URL from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` env vars.

**`civicApi.ts`** — Implements `resolveDistricts` via Geocodio API. Maps response to `District[]`. Will be replaced by an Edge Function proxy in Phase B3.

**`services/index.ts`** — Exports a single `service` instance. Swap implementation here without touching any component.

**Enforcement:** No component should ever import from `civicApi.ts` or `supabaseClient.ts` directly. All data access goes through the `service` singleton. Enforce with ESLint `no-restricted-imports`.

**Edge Functions (Deno, in `supabase/functions/`):**
- `submit-question` — validates candidateId, derives authorHandle from session, inserts question
- `vote-question` — INSERT with ON CONFLICT DO NOTHING + atomic count increment
- `submit-feedback` — simple insert
- `proxy-civic-api` — proxies Google Civic API with server-side key

---

## 5b. Database Schema (Supabase / PostgreSQL)

Migrations live in `supabase/migrations/`. Types auto-generated to `src/types/supabase.ts`.

```
districts
  code          TEXT PRIMARY KEY        -- e.g., "GA-SEN-D40", "ATL-CC-D6"
  level         TEXT NOT NULL           -- city | county | state | federal
  office_title  TEXT NOT NULL
  district_name TEXT NOT NULL
  display_label TEXT NOT NULL

candidates
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  name          TEXT NOT NULL
  initials      TEXT NOT NULL
  office_title  TEXT NOT NULL
  district_code TEXT REFERENCES districts(code)
  party         TEXT NOT NULL
  status        TEXT CHECK (status IN ('unclaimed','claimed','active'))
  filing_id     TEXT                    -- GA SOS filing ID (unclaimed)
  filing_date   TEXT                    -- filing date string (unclaimed)
  campaign_url  TEXT
  video_count          INT DEFAULT 0
  question_count       INT DEFAULT 0
  answered_question_count INT DEFAULT 0
  response_rate        REAL DEFAULT 0
  opponent_count       INT DEFAULT 0
  created_at    TIMESTAMPTZ DEFAULT now()
  updated_at    TIMESTAMPTZ DEFAULT now()

candidate_positions
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  candidate_id  UUID REFERENCES candidates(id)
  position_text TEXT NOT NULL
  sort_order    INT DEFAULT 0

videos
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
  candidate_id      UUID REFERENCES candidates(id)
  post_type         TEXT CHECK (post_type IN ('statement','response-to-opponent','qa-reply'))
  caption           TEXT
  thumbnail_url     TEXT
  video_url         TEXT
  reaction_count    INT DEFAULT 0
  question_count    INT DEFAULT 0
  published_at      TIMESTAMPTZ DEFAULT now()
  answers_question_id UUID
  chain_id          UUID
  chain_depth       INT

questions
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
  video_id          UUID REFERENCES videos(id)         -- nullable (profile-level questions)
  topic_id          UUID                                -- nullable
  candidate_id      UUID REFERENCES candidates(id) NOT NULL
  text              TEXT NOT NULL
  author_handle     TEXT NOT NULL
  plus_one_count    INT DEFAULT 0
  state             TEXT DEFAULT 'default'              -- default | voted | answered
  answer_video_id   UUID
  created_at        TIMESTAMPTZ DEFAULT now()

topics
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  candidate_id  UUID REFERENCES candidates(id)
  title         TEXT NOT NULL
  source_badge  TEXT NOT NULL

debate_chains
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  district_code TEXT REFERENCES districts(code)
  topic_label   TEXT NOT NULL
  opened_at     TIMESTAMPTZ DEFAULT now()
  total_questions INT DEFAULT 0

chain_participants
  chain_id          UUID REFERENCES debate_chains(id)
  candidate_id      UUID REFERENCES candidates(id)
  responses_used    INT DEFAULT 0
  responses_allowed INT DEFAULT 2
  PRIMARY KEY (chain_id, candidate_id)

chain_nodes
  video_id        UUID PRIMARY KEY REFERENCES videos(id)
  chain_id        UUID REFERENCES debate_chains(id)
  candidate_id    UUID REFERENCES candidates(id)
  parent_video_id UUID REFERENCES videos(id)    -- nullable (root node)
  depth           INT NOT NULL

question_votes
  user_id       UUID NOT NULL
  question_id   UUID REFERENCES questions(id) NOT NULL
  created_at    TIMESTAMPTZ DEFAULT now()
  PRIMARY KEY (user_id, question_id)            -- enforces one vote per user per question

feedback
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid()
  text      TEXT NOT NULL
  category  TEXT CHECK (category IN ('bug','feature','general'))
  email     TEXT
  page      TEXT
  created_at TIMESTAMPTZ DEFAULT now()

user_profiles (Phase B4)
  id        UUID PRIMARY KEY REFERENCES auth.users(id)
  handle    TEXT UNIQUE NOT NULL        -- auto-generated @voter_<short_id>
  created_at TIMESTAMPTZ DEFAULT now()

candidate_claims (Phase B5)
  candidate_id        UUID UNIQUE REFERENCES candidates(id)
  user_id             UUID REFERENCES auth.users(id)
  claimed_at          TIMESTAMPTZ DEFAULT now()
  verification_status TEXT DEFAULT 'pending'  -- pending | verified | rejected
```

**RLS policies:** SELECT on all tables for `anon` role (public reads). Write policies added per phase.

---

## 6. Routing

React Router v6.

```
/                           LandingPage
/onboarding                 OnboardingPage
/app                        AppShell (protected — requires completed onboarding)
  /app/feed                 FeedPage (default tab)
  /app/feed/video/:videoId/questions          QuestionsDrawerPage (overlay)
  /app/feed/video/:videoId/answer/:answerId   AnswerVideoPage
  /app/districts            DistrictBrowserPage
  /app/ask                  (future — redirect to feed for now)
  /app/reps                 RepsPage
  /app/profile/:candidateId CandidateProfilePage
  /app/chain/:chainId       DebateChainPage
/claim/:candidateId         (future — separate from app shell from day one)
```

The "back" button on AnswerVideoPage navigates to `/app/feed/video/:videoId/questions`, not to `/app/feed`. QuestionsDrawerPage is an overlay on FeedPage, not a replacement.

---

## 7. PWA Considerations

- **Shell offline-first:** App shell, routing, static assets pre-cached.
- **Feed stale-while-revalidate:** Last-fetched feed served from cache with background refresh.
- **Civic API network-first:** 5s timeout, cached fallback or degraded state.
- **Video content network-only:** No video caching (too large).
- **Font caching:** Stylesheets: stale-while-revalidate. Font files: cache-first, 1-year TTL.
- **`display: 'standalone'`**, `start_url: '/app/feed'`, `theme_color: '#0D1F3C'`.
- **Installability:** Installed PWA opens to feed, not landing page.

---

## 8. CSS Architecture

**`tokens.css`** — Single source of truth. All `--rep-` prefixed.

```css
:root {
  --rep-navy:      #0D1F3C;
  --rep-blue:      #1A4A7A;
  --rep-blue-mid:  #2E6AAF;
  --rep-blue-lt:   #E8F0F9;
  --rep-gold:      #B8922A;
  --rep-gold-lt:   #F5EED8;
  --rep-gold-wash: rgba(184,146,42,0.08);
  --rep-gold-border: rgba(184,146,42,0.25);
  --rep-ink:       #1A1C22;
  --rep-steel:     #4A5568;
  --rep-mist:      #EEF1F6;
  --rep-cream:     #F7F5EF;
  --rep-white:     #FAFBFC;
  --rep-rule:      #D1D9E6;
  --rep-green:     rgba(100,180,140,0.75);
  --rep-green-lt:  rgba(100,180,140,0.06);
  --rep-green-border: rgba(100,180,140,0.2);
  --rep-dark-bg:   #080a0e;
  --rep-dark-rule: rgba(255,255,255,0.06);
  --rep-font-display:    'Playfair Display', serif;
  --rep-font-ui:         'IBM Plex Sans', system-ui, sans-serif;
  --rep-font-mono:       'IBM Plex Mono', monospace;
  --rep-radius:    2px;
  --rep-transition: 0.15s ease;
}
```

- Co-located CSS files per component: `PlusOneButton.tsx` + `PlusOneButton.css`
- Never hardcode `border-radius` — always `var(--rep-radius)`
- Use `100dvh` not `100vh` for mobile Safari
- Google Fonts loaded via `<link>` in `index.html` with `&display=swap`, not CSS `@import`

---

## 9. Extensibility Concerns

1. **District types** — `level` union will grow (school board, water district, etc.). Default cases in every switch. Mark with `// EXTENSIBILITY` comments.
2. **Video post types** — Use a lookup map for labels and tag colors, not switch/hardcoded strings.
3. **Question surfaces** — Questions attach to `videoId` or `topicId`. New attachment points will emerge. Components must not assume `videoId` is always present.
4. **Candidate claim flow** — `/claim/:candidateId` is a distinct route from day one, separate from the app shell.
5. **Backend coupling** — ESLint `no-restricted-imports` on service files. Everything goes through the `service` singleton.
6. **Real-time +1** — Sorting is the hook's responsibility, not the component's. When WebSocket/SSE arrives, only the hook changes.
7. **Debate chains** — Build `buildChainTree()` utility from day one even if UI is initially flat.
8. **Notification email** — HTML lives in backend when real, not in React. Wireframe is reference only.

---

## 10. Build Sequence

### Phase 1 — Foundation
Scaffold Vite + React + TS, tokens.css, reset/typography/textures/global CSS, domain types, DataService interface, mock data, PWA manifest, placeholder icons.

### Phase 2 — Primitives
Logotype, GoldRule, MonoText, Tag, StatusPill, Avatar, ScanlineOverlay, PlusOneButton (all 3 states), EmDash.

### Phase 3 — Layout Shell
AppRouter, UserContext, TopNav, BottomNav, AppShell, LandingPage (port from HTML).

### Phase 4 — Video Feed
VideoPlayer, VideoOverlay, VideoRightRail, VideoCard, FeedContext, useVideoFeed, FeedPage.

### Phase 5 — Questions Drawer
VideoThumbBar, QuestionRow, QuestionInput, QuestionDrawer, useQuestions, usePlusOne, QuestionsDrawerPage.

### Phase 6 — Answer Video
QuestionContextBanner, AnswerVideoPage.

### Phase 7 — Candidate Profiles
ProfileHeader, ProfileStats, ProfileTabs, UnclaimedBanner, PositionsList, VideoGrid, EmptyVideoGrid, CandidateProfilePage.

### Phase 8 — Empty States & Topics
GeneralQuestionBox, TopicCard, empty-state prompts.

### Phase 9 — Debate Chains
buildChainTree, ChainNode, ChainRespondChips, DebateChain, DebateChainPage.

### Phase 10 — Onboarding
OnboardingPage, real Civic API integration, district reveal, UserContext persistence.

### Phase 11 — PWA Finalization
dvh audit, installability testing, production icons, Workbox caching, offline behavior, iOS/Android meta tags.

---

## Critical Warnings

1. **Never couple components to API clients directly.** Always go through the service interface.
2. **Never hardcode `border-radius`.** One `8px` from a tutorial breaks the brand.
3. **PlusOneButton state machine** — `answered` state must call `onWatchReply`, not `onVote`. Test explicitly.
4. **Font loading** — `<link>` in HTML, not CSS `@import`. Parallel vs. blocking.
5. **State persistence** — `votedQuestionIds`, `hasCompletedOnboarding`, `districts` must survive page refresh via `localStorage`.
