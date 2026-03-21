# Rep. — Full Project Context
> Handoff document for Claude Code. Contains all product decisions, design system, interaction mechanics, screens, brand, and go-to-market strategy established in the initial design session.

---

## 1. What Rep. Is

A mobile civic accountability app that identifies every elected official and candidate in a user's **actual voting districts** — from city/county commissioners up to congressional and Senate candidates — based on their home address. It gives those officials a direct channel to communicate with constituents via video posts, Q&A responses, and debate chains. Constituents can ask questions, +1 questions others have asked, and watch video replies.

**The core problem it solves:** Most people can't name their city council member, let alone their state representative. Existing tools (social media, campaign websites) are not district-filtered, not structured for accountability, and not designed for direct Q&A.

**Platform:** Mobile-first (iOS/Android). Web to follow.

**Stage:** Pre-launch. Wireframes and brand complete. No working prototype yet.

---

## 2. The App Name & Brand

### Name
**Rep.** — with a hard period. The period is structural and always rendered in gold. It reads simultaneously as:
- Abbreviation for *representative*
- A full stop — accountability, finality

### Typography
- **Display / headings:** Playfair Display (serif) — 700 for display, 500 for headings, 400 italic for subheads and warm/human moments
- **UI / body / labels:** IBM Plex Sans — 600 for labels (uppercase, tracked), 400 for body, 300 for large descriptive text
- **Data / IDs / monospace:** IBM Plex Mono — used for filing IDs, counts, district codes, source citations

### Color System
| Name | Hex | Usage |
|------|-----|-------|
| Navy | `#0D1F3C` | Primary identity color — headers, buttons, dark UI backgrounds |
| Blue | `#1A4A7A` | Secondary blue |
| Blue mid | `#2E6AAF` | Links, interactive tags |
| Blue light | `#E8F0F9` | Tag backgrounds |
| Gold | `#B8922A` | Always used for the period in "Rep." — accent borders, unclaimed-profile warning state, +1 voted state |
| Mist | `#EEF1F6` | Page backgrounds, step cards |
| Cream | `#F7F5EF` | Section backgrounds |
| White | `#FAFBFC` | Card backgrounds |
| Rule | `#D1D9E6` | Borders, dividers |
| Ink | `#1A1C22` | Body text |
| Steel | `#4A5568` | Secondary text |
| Green | `rgba(100,180,140,0.75)` | Answered states, confirmed/active states |

### Tone
**Civic and trustworthy — serious, institutional.** Rep. speaks like a well-edited newspaper, not a startup. Sentences are declarative and complete. No exclamation marks. No emoji. Data is cited precisely. The tone assumes the reader is a serious adult who cares about how their community is governed. Think: The Economist, ProPublica, C-SPAN — but actually well designed.

### Visual Language
- **Squared corners everywhere** (2px radius max) — closer to a printed document than a consumer app. Distinguishes it from TikTok/Instagram rounded-corner language.
- The thin **gold rule line** between navbars and content is a continuous identity signal across all screens, including the dark video UI.
- **Scan-line texture** on dark video backgrounds (subtle repeating-linear-gradient) adds gravitas.
- **IBM Plex Mono** for any data, counts, district codes — reinforces the "built on real public records" credibility.
- The **gold period** after "Rep" appears in every instance of the logotype at every size.

---

## 3. Core User Flows

### 3.1 Onboarding
1. User enters home address
2. App resolves all voting districts via **Google Civic Information API**
3. User sees a list of their districts — city council, county, state senate, state house, US house, US senate
4. These districts become the permanent filter for everything they see in the app

**Note on verification:** Address verification and candidate identity verification are explicitly **out of scope for v1**. Soft trust signals (response rate, account age, post history) do the work initially.

### 3.2 Constituent Home Feed
- Shows video posts from officials and candidates **in the user's districts only**
- Filtered by tabs: All / City / State / Federal
- Posts are tagged by type: Statement / Response to opponent / Q&A reply
- Swipe vertically for next video (TikTok-style)
- Dark full-screen video UI with Rep. brand maintained via:
  - Navy top nav with gold rule border and small monospace district context string (e.g. `GA-SEN-D40 · 6 districts`)
  - Italic Playfair caption overlay at bottom-left of video
  - Single post-type tag (bottom-left, below caption)
  - Squared-corner right rail: reaction count and question count only (numbers, no text labels)
  - Gold rule border above bottom nav

**What is intentionally NOT on the video overlay:**
- Candidate name and office (already in the nav context string — redundant on the video itself)
- Avatar
- District/office banner
- Multiple tags

### 3.3 Questions Drawer
Accessed from any video via the questions icon in the right rail. Shows constituent questions for **that specific video only** — not the candidate globally. Every video has its own independent question section.

**Layout:** Each question is a full-width row with two columns:
- **Left column (44px fixed width):** +1 button — shows `+1` in IBM Plex Mono above the count. Tappable.
- **Right column:** Question text (IBM Plex Sans 11px, `rgba(255,255,255,0.78)`) + user handle below in IBM Plex Mono (`rgba(255,255,255,0.2)`)

**Top of drawer:** Compressed video thumbnail (100px tall) showing the video still with italic Playfair caption. This is the only candidate context needed — no header, no name, no avatar.

**+1 Mechanic — three states:**

| State | Left col | Row background | Right col |
|-------|----------|----------------|-----------|
| Default | Muted `+1` + count | None | Question text + handle |
| Voted | Gold `+1` + count | Subtle gold wash | Question text + handle |
| Answered | Green `✓` + count | Subtle green wash | Question text + handle + "Watch reply" badge |

The **"Watch reply" badge** replaces the +1 on answered questions. It shows a small play triangle + "Watch reply" text in green. The entire answered row is tappable — tapping jumps directly to the answer video.

**Questions are sorted by +1 count descending.**

**Input bar at bottom:** "Ask your own question..." field + Submit button (navy background, gold border).

### 3.4 Answer Video (reached from answered question)
- Back button top-left returns to the **questions list** (not the main feed — preserves context)
- Original question shown in a banner at the **top** of the video frame: label "Answering" in gold + question text in italic IBM Plex Sans
- Video plays normally with right rail (reactions, share)
- Tag at bottom shows "Q&A reply" in green
- If someone arrives at this video from the main feed rather than via the questions list, they still always see what was being asked

### 3.5 Candidate Profile
Three tabs — accessed from the main feed by tapping a candidate's name or from the Reps nav tab.

**Profile header:**
- Square-ish avatar with initials (navy background)
- Name in Playfair, office/district in IBM Plex Sans, district code in IBM Plex Mono
- Status pill: green "✓ Active on Rep." or gold "⚬ Not yet claimed"
- Stats row: Videos / Q's answered / Response rate (%)

**Positions tab:**
- Bulleted list of the candidate's stated positions
- "Debate threads they're in" section — each thread shows topic + candidate count + "Watch →" link

**Videos tab:**
- 3-column grid of video thumbnails (9:16 aspect ratio)
- Videos that are part of a debate chain show a `chain ×N` badge

**Q&A tab:**
- Questions from constituents across all their videos
- Answered questions show green "✓ Answered by video" badge
- Unanswered show +1 button

---

## 4. Video & Debate Chain System

### 4.1 Video Post Types
- **Statement** — candidate's original take on an issue or event
- **Response to opponent** — reacting to another candidate's video or public statement
- **Q&A reply** — video response to a specific constituent question

### 4.2 Debate Chains — Rules (confirmed, non-negotiable)
1. **Chains are started by responses** — a chain does not exist until a candidate responds to another candidate's video. The responded-to video becomes the root.
2. **Each candidate gets 2 responses per chain** — once used, their respond option is disabled for that chain only. Other chains are unaffected.
3. **Any candidate in the same race can enter a chain** — not just the original two parties.
4. **Constituent questions attach to each individual video** — every node in the chain has its own separate question section with its own +1 votes.
5. **Indentation shows reply relationships** — root video at top, responses visually indented by who they're replying to.

### 4.3 Debate Chain UI
**Header:**
- Gold eyebrow label: topic name (e.g. "SB 204 · Small Business Taxation")
- Playfair headline: "N candidates · N videos · N constituent questions"
- IBM Plex Mono footer: `GA-SEN-D40 · Chain opened [date]`

**Each node:**
- Square avatar (initials, 2px radius) with spine line to children
- Video thumbnail with play button
- Candidate name + office in IBM Plex Sans
- Response budget shown as filled/empty pips — gold pip = used, muted pip = remaining
- Italic Playfair caption (what was said)
- Reaction count + question count in IBM Plex Mono

**Below each node — respond chips for all candidates in the race:**
- Active (gold border): `[initials] · respond ↗`
- Disabled — limit reached: `[initials] · limit reached` (muted)
- Disabled — own video: `[initials] · 1 left` or similar

**Chain status footer:**
IBM Plex Mono row showing remaining budget per candidate, e.g.:
`SR · 0 of 2 remaining   TB · 1 of 2 remaining   MJ · closed`

### 4.4 Candidate-Side: Video Reply to Constituent Question
1. Candidate sees the constituent's question (with +1 count and handle) in their dashboard
2. Records directly in-app or selects from their clip library
3. Reply is published as a new video, linked to the original question
4. The question's row in the drawer updates to "Watch reply" state
5. Tapping the answered question from the feed jumps directly to the reply video with the original question in a top banner

---

## 5. Unclaimed Profile System

This is the **core go-to-market mechanic** — it lets the app accumulate constituent engagement before any candidate has signed up.

### How it works
1. Rep. auto-generates profiles for every candidate in covered districts from **public filing records** (Secretary of State)
2. Profiles auto-populate: name, office sought, party, filing date, campaign website URL
3. Constituents can leave questions on unclaimed profiles immediately
4. Every question submission triggers a **notification email to the candidate** at their registered campaign contact email

### Unclaimed Profile UI (constituent view)
- Striped yellow-diagonal warning banner at top: "This candidate hasn't joined yet. Their profile is built from public records. Leave a question — they'll be notified."
- Dashed-border avatar circle (no photo, just initials in muted gray)
- Yellow `⚬ Not yet joined` pill
- Public record section with source badge (`GA SOS filing`): party, filing date, campaign site, filing ID in IBM Plex Mono
- Stats row: Videos = `—` (em dash, not zero), Questions = live count, Response rate = `—`

**Critical distinction on stats:** Use an em dash (—) not zero for Videos and Response rate on unclaimed/empty profiles. Zero implies the candidate has been active and answered nothing. A dash signals the data simply doesn't exist yet — honest about the state.

### Questions on Unclaimed Profiles — Two Layers

Because there is no video to attach questions to, the unclaimed profile has two distinct question surfaces:

**1. General question box** — sits at the top of the profile, above any topics. Catches anything a constituent wants to ask that doesn't fit a specific topic. Label: "General questions for [name]" with live count in gold IBM Plex Mono. Standard +1 mechanic applies.

**2. Auto-generated topic cards** — pulled from public data sources (school board agendas, APS enrollment reports, budget filings, legislative records, etc.). Each topic card shows:
- Topic title in Playfair 500
- Source badge in IBM Plex Mono (e.g. `APS enrollment data`, `APS board agenda`)
- Its own question list with +1 voting
- Its own "Ask about this topic..." input bar

Topics give constituents something concrete and issue-specific to react to before the candidate has posted anything. Questions stay contextually grouped rather than all dumping into one generic inbox.

**Data sources for auto-generated topics (v1 targets):**
- Atlanta Public Schools board meeting agendas (for school board races)
- APS enrollment and facility reports
- Georgia General Assembly bill history (for state races)
- City council meeting agendas (for city races)
- Secretary of State candidate filing statements where positions are declared

**Questions persist across all state transitions.** Everything asked before a candidate joins carries forward into their claimed profile's Q&A tab. Nothing is lost when they claim.

### Notification Email to Candidate
**Subject:** `47 voters in District 6 have questions for you`

**Structure:**
1. Rep. logo + wordmark
2. "Hi [name]," — direct greeting
3. One-line explanation: their profile was built from public filing records
4. Three stat cards: questions waiting / district residents / opponents already active on Rep.
5. Top upvoted question shown in full with upvote count and handle
6. Copy: "Claim your profile to respond with video, add your positions, and reach voters directly."
7. Gold CTA button: "Claim your profile — it's free"
8. Fine print: explains how they were found (SOS filing), unsubscribe link

**Key hook:** "N opponents already active" — no candidate wants to be the only one not showing up.

### Claimed Profile Transition
- Yellow unclaimed banner disappears
- Dashed-border avatar → solid navy avatar (2px radius square, not circle)
- Yellow pill → green "✓ Active on Rep." pill
- Positions, videos, Q&A tabs become populated
- Response rate metric appears once first video reply is posted

### Claimed Profile — No Videos Yet State

A candidate may claim their profile but not have posted any videos yet. This state is distinct from both unclaimed and fully active.

**Videos tab:**
- 3-column grid shows three dashed placeholder cells with a `+` symbol — visible to constituents on the Videos tab
- Empty-state prompt below the grid: "No videos posted yet. [Name] has joined Rep. but hasn't posted a video. [N] questions from District [X] residents are waiting for a reply."
- The question count in the prompt is live — it updates as more constituents ask questions, creating increasing pressure on the candidate

**Q&A tab:**
- All questions from before they claimed (general + topic questions) are visible here
- +1 voting still works
- No "Watch reply" badges yet — all questions show default or voted +1 state

**Stats row when claimed but no videos:**
- Videos: `0` (they have claimed so this is now an accurate count, not an absence of data)
- Questions: live count
- Response rate: `—` (no responses yet, so rate is undefined not zero)

---

## 6. Go-to-Market Strategy

### The cold-start problem
Rep. is a two-sided marketplace (constituents and candidates). The strategy to break the chicken-and-egg loop without needing any pre-existing political connections:

**Step 1 — Seed constituents first via community channels:**
- Nextdoor (civic intent already built in — people already complain about local issues there)
- Local Facebook groups and community pages
- Seed posts: "I just left a question for [candidate] on Rep. — here's what I asked" with a link to the unclaimed profile

**Step 2 — Target school board candidates as the first outreach:**
- Races decided by tiny margins (sometimes dozens of votes)
- Candidates are reachable directly — no campaign manager gatekeeping, no political consultant blocking access
- No existing social media strategy to compete with
- High constituent engagement right now nationally (curriculum fights, safety, budget)
- Thousands of races per year across the country
- You can walk into a single contested race, find candidates via public filings, and cold-email every one

**Step 3 — Let question volume do the selling:**
- Don't pitch the concept — show candidates a waiting audience
- The notification email does the work: 47 questions waiting is a fundamentally different conversation than "here's our pitch deck"

**Step 4 — Scale up the race ladder:**
- School board → city council → state legislature → federal
- Each level uses the previous as proof of concept

### Launch market
Atlanta, GA (update if different). The landing page is currently written for Atlanta.

### Data source for district resolution
**Google Civic Information API** — maps any US address to its exact voting districts. This is the confirmed integration for the onboarding flow.

---

## 7. Landing Page

The landing page (`rep_landing.html`) is complete. It is production-ready HTML/CSS with responsive breakpoints.

**Structure:**
1. **Top rule** — 4px navy bar
2. **Masthead** — newspaper format. "Rep." at 96px Playfair, gold period. Dateline: "Atlanta, GA · Est. 2026". Edition note: "Civic accountability platform · Free to join". Tagline + description.
3. **Hook section** — "You voted for these people. Do you know what they're doing?" — two overlapping phone mockups (video feed behind, questions drawer in front) — primary CTA "Join the waitlist" + secondary "See how it works →"
4. **How it works** — 3 numbered steps with large ghost numerals, connected by arrows
5. **Proof band** — 3 statistics on full navy background with gold rule borders (VERIFY THESE before publishing)
6. **Candidate section** — unclaimed profile card mockup (left) + "Your constituents are already asking questions" copy + 3-step claim process + "Claim your profile" gold CTA
7. **Waitlist form** — email field + zip code field + "Notify me" button. Zip gives geographic demand data.
8. **Footer** — logo, city/year, links (Privacy / Terms / For candidates / Contact)

**CTAs:**
- Primary (constituents): Join the waitlist → email + zip
- Secondary (candidates): Claim your profile → same form with flag, or separate flow

---

## 8. Files in This Project

| File | Contents | Status |
|------|----------|--------|
| `rep_brand.html` | Full brand system — logo variants, palette, type scale, voice examples, UI components, onboarding screen | Complete |
| `rep_landing.html` | Full landing page, responsive | Complete |
| `rep_video_revised.html` | Stripped video feed + questions drawer (definitive versions of these two screens) | Complete |
| `rep_plus_one.html` | +1 button mechanic — all three states with anatomy callouts | Complete |
| `rep_answer_jump.html` | Answered question → answer video jump + back navigation + question banner | Complete |
| `unclaimed_profile_wireframes.html` | Three screens: unclaimed profile (constituent view), notification email, claimed profile | Complete |
| `chain_wireframes.html` | Debate chain rules/budget diagram + live chain UI with per-video comments | Complete |
| `rep_empty_states.html` | Two empty profile states: unclaimed with auto-generated topic cards + general question box; claimed with empty video grid and waiting questions | Complete |
| `rep_video_screens.html` | Earlier version of video screens — superseded by `rep_video_revised.html` | Superseded |

---

## 9. Screens Not Yet Designed

The following are defined in product terms but not yet wireframed:

- **Candidate dashboard** — candidate-side view of their question list ("47 neighbors have this question"), response budget tracker per chain, video recording/upload interface, analytics
- **District browser** — the "Districts" tab in bottom nav; structured list of all user's districts with officials per district, filterable
- **Full onboarding flow** — address entry → loading/resolving state → district reveal → "Here are your 6 reps" confirmation screen
- **Notifications screen** — what push notifications look like when a rep posts, a question is answered, a chain gets a new response
- **Settings / account** — address management, notification preferences, user profile
- **Candidate claim flow** — web or mobile flow a candidate goes through to claim their unclaimed profile
- **Search / discovery** — whether and how users can find candidates outside their own districts
- **Empty feed state** — what the home feed looks like for a district where no candidates have posted anything yet (candidate profile empty states are designed — see Section 5 — but the feed-level empty state is separate and still undesigned)

---

## 10. Open Product Decisions

These were raised during the session but not fully resolved:

| Question | Current assumption | Status |
|----------|-------------------|--------|
| Can constituents post video? | No — text questions only. Candidates/officials post video. | Assumed, not confirmed |
| Can candidates post original videos (not replies)? | Yes — statements and Q&A replies are both original posts | Confirmed |
| Can users browse candidates outside their district? | Not decided | Open |
| What happens when a chain reaches maximum depth/responses? | The chain closes — no more responds possible for that candidate | Confirmed |
| Verification for candidate claiming | Soft/light-touch in v1 — no hard identity verification | Confirmed |
| Statistics on landing page proof band | Need real source verification before publishing | Open |
| Launch geography | Atlanta, GA — update landing page copy if different | Open |

---

## 11. Technical Constraints & Notes

- **Google Civic Information API** — district resolution from address. Needs API key and integration in onboarding flow.
- **Secretary of State public filings** — source for auto-generated candidate profiles. Each state has different data formats; Georgia SOS is the v1 target.
- **No verification system in v1** — both address and candidate identity rely on self-reported or public filing data only.
- All existing wireframe/brand files are **plain HTML/CSS** — no framework. Google Fonts imported from `fonts.googleapis.com` (Playfair Display, IBM Plex Sans, IBM Plex Mono).
- The dark video UI uses a repeating-linear-gradient scan-line texture — this is intentional for brand gravitas, not a bug.
- All existing files should be ported to **React Native** for the mobile app, with the HTML files serving as pixel-accurate design references.
- The landing page (`rep_landing.html`) can be deployed as-is or ported to a web framework. It is fully responsive with breakpoints at 720px.
