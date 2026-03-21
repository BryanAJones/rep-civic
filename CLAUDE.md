# Rep. — Project Instructions

## What This Is

A civic accountability PWA that connects constituents with their elected officials via district-filtered video Q&A. See `rep_project_context.md` for the full product spec.

## Tech Stack

- **Platform:** Progressive Web App (PWA) — not native. Chosen for fast prototyping, reuse of existing HTML/CSS artifacts, and no app store account dependency.
- **Framework:** Vite + React + TypeScript
- **PWA tooling:** vite-plugin-pwa (Workbox under the hood)
- **Styling:** CSS — the brand system is already defined in plain CSS across the wireframe files. Preserve it. No Tailwind, no CSS-in-JS unless explicitly discussed.
- **Fonts:** Google Fonts — Playfair Display, IBM Plex Sans, IBM Plex Mono (already imported in all wireframe files)
- **API:** Google Civic Information API for district resolution from address
- **Backend:** TBD — not yet chosen. Do not assume or scaffold a backend without discussion.
- **State management:** TBD — keep it simple until complexity demands otherwise.

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
- **CSS:** Use CSS custom properties for the color palette and type scale. Define them once in a root stylesheet, reference everywhere.
- **No premature abstraction.** Build the specific thing first. Generalize only when a real second use case appears.
- **Mobile-first.** All layouts start at ~375px and scale up. The primary breakpoint is 720px (matching the landing page).

## What's Built vs. Not Built

**Designed (wireframes exist):** Landing page, video feed, questions drawer, +1 mechanic, answer jump, unclaimed profiles, notification email, claimed profile, empty states, debate chains.

**Not yet designed:** Candidate dashboard, district browser, full onboarding flow, notifications, settings, candidate claim flow, search/discovery, empty feed state.

**Not yet built:** Everything. No working prototype exists. The HTML wireframes are reference only.

## Key Product Decisions

- Constituents ask text questions only. Officials/candidates post video.
- Every video has its own independent question section (not per-candidate globally).
- Questions sorted by +1 count descending.
- Debate chains: 2 responses per candidate per chain, any same-race candidate can enter.
- Unclaimed profiles auto-generated from public filings — the core go-to-market mechanic.
- No verification in v1 — soft trust signals only.
- Launch market: Atlanta, GA.
