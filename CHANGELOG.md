# Rep. — Changelog

> What shipped and when. Newest entries first.
> Each entry corresponds to a git commit or logical milestone.

---

## [0.19.4] - 2026-05-12 — Retire orphan `claim-candidate` Edge Function

### Security
- **Deleted the deployed `claim-candidate` Edge Function from Supabase.** The source was removed 2026-05-05 in the B6-1 cutover, but the deployed function (version 4, last updated 2026-03-31) was never explicitly torn down via `supabase functions delete`. It remained reachable for 7 days under deletion notice — and ~6 weeks running its pre-B6-1 logic, which would write `candidate_claims` with `verification_method: 'self_attestation'` for any non-anonymous caller posting `{ candidateId }`. No filing-ID check, no FEC committee email, no magic-link round-trip. A complete bypass of the B6-1 ceremony.
- **Audit log query confirms 0 exploits.** Out of all `candidate.claimed` events recorded since the `audit_log` trigger went live (2026-04-18), 0 used `self_attestation`. Cross-check against the live `candidate_claims` table also shows 0 surviving rows with that verification method. The gap was open from 2026-03-31 → 2026-05-12 but unexploited.
- **CLAUDE.md updated** to list the real authed-write surface (`submit-question`, `vote-question`, `submit-video-answer`, and `verify-candidate-claim` initiate). The previous wording still mentioned `claim-candidate` despite the function no longer existing.

---

## [0.19.3] - 2026-05-12 — Server-derived candidateId on video answers (S-12)

### Security
- **`submit-video-answer` derives `candidate_id` from the session's claim.** The function previously read `candidateId` from the request body and validated that the caller owned a matching row in `candidate_claims`. The body input is now ignored entirely: the Edge Function looks up `candidate_claims WHERE user_id = auth.uid()` and returns 403 if the caller has no claim. Storage RLS already gated the upload by path prefix, so this closes the parallel gap on the `videos` insert: a verified caller can no longer pass an arbitrary `candidateId` in the body and have it land in the answer row even with a valid upload. Edge Function deployed before the client so old clients (still sending `candidateId` in the body) continue to work — the server just stops trusting that value.

### Changed
- **`supabaseService.submitVideoAnswer` no longer forwards `candidateId` to the Edge Function body.** The argument is still part of the function signature because the client needs the value locally to construct the Storage path `<candidate_id>/<uuid>.<ext>` that Storage RLS enforces. Internal contract only; no UI change.

---

## [0.19.2] - 2026-05-12 — Claim error capture (B6-12)

Unblocks triage on the next mobile claim non-2xx repro. The previous error path on `verify-candidate-claim` failures threw a `FunctionsHttpError` whose response body was never read, so even the user-facing copy fell through to a generic "Could not verify" line — and there was no way to recover the status or `code` from a phone where DevTools is unavailable.

### Added
- **`src/utils/claimErrorLog.ts`.** Reads the FunctionsHttpError `context.response` body (JSON first, plain-text fallback), pulls out `status` + `code` + raw `body` + the call context (action, candidateId, level, filingId, isAnonymous, userAgent), writes a structured detail to `console.error`, and persists the last 10 errors to localStorage under `__rep.claimErrors`. Never throws — quota and parse errors are swallowed so the logger can't break the surrounding flow. New unit suite covers status/code extraction, text-body fallback, ring-buffer cap + ordering, quota-error tolerance, and the `claimErrorToCopy` mapping.
- **"Copy diagnostics" button on the error step in `ClaimModal` and `ClaimFinalizePage`.** Serializes the ring buffer as JSON to the clipboard (with a `window.prompt` fallback for older mobile browsers without the async Clipboard API). A user dogfooding on mobile can hit a non-2xx, tap the button, and paste the captured payload into feedback or a text without ever opening DevTools.

### Fixed
- **`errorToCopy` read non-existent properties on `FunctionsHttpError`.** The previous helper expected `context.status` and `context.body.code`, but the real shape is `context.response: Response` — the body is a stream we have to `clone().json()`. Every 404/409/429/501/502 was silently falling through to the generic catch-all instead of surfacing the right copy. Replaced by the new `claimErrorToCopy(detail)` which operates on the structured detail produced by `extractClaimError`.

---

## [0.19.1] - 2026-05-12 — Stable seed-test-claim URL (B6-11)

### Fixed
- **`scripts/seed-test-claim.ts` produces a stable candidate id across re-runs.** The previous `upsert` keyed on `filing_id` was generating a fresh `gen_random_uuid()` whenever a prior test row had been cleaned up, which broke the dogfooding URL between runs. Replaced with an explicit `SELECT … WHERE filing_id = …` → `UPDATE` existing row by id (so FK references from `pending_claims` / `candidate_claims` survive) or `INSERT` with a deterministic `TEST_CANDIDATE_ID = '00000000-0000-4000-8000-000000000001'` on fresh seeds. Internal-only; no user-facing change.

---

## [0.19.0] - 2026-05-05 — Calm-dossier empty states + Web Share + Edge Function consolidation

### Added
- **`ProfileShareButton`.** Web Share API on supported browsers (mobile, Safari), clipboard fallback elsewhere with a "Copied" confirmation. Status-aware copy: unclaimed leads with "Profile assembled from public filings"; claimed and active are neutral. Wired into `CandidateProfilePage` as a right-aligned row above `ProfileStats`.
- **`_shared/rateLimit.ts`.** Extracts the `check_rate_limit` RPC call into one helper. Same `{ ok, response }` shape as `requireVerifiedUser` so callers short-circuit identically. Used by the four authed Edge Functions.

### Changed
- **Empty-state copy across `CandidateProfilePage`.** Calm-dossier rewording per the design doc: silence reported as fact, not failure. `EmptyVideoGrid` drops the placeholder `+` glyph and rewords to "{name} has not posted any videos. N constituent questions pending." (mono count). Profile-page stubs swap "No videos yet." / "No questions yet." for "{name} has not posted any videos." / "{name} has not received any constituent questions yet." Unclaimed positions read "Profile assembled from public filings — no stated positions on record."
- **`submit-question`, `vote-question`, `submit-video-answer` migrated to `_shared/auth.ts` + `_shared/rateLimit.ts`** (B6-7). Drops ~25 lines of identical auth/rate-limit boilerplate from each function. `verify-candidate-claim` also drops its inline rate-limit block in favor of the helper. Net −301/+140 across the four functions. `proxy-geocodio` and `proxy-voterinfo` intentionally skipped — they don't gate on email-verified callers.

### Notes
- B6-2's third piece — Cloudflare Worker `/og?candidate=[id]` for 1200×630 dossier OG images — is intentionally deferred. It's a separate deploy target on the Pages project and warrants explicit user setup; not blocked, just paused.
- B6-7 marked done in BACKLOG; B6-2 stays in-progress until OG worker ships.

---

## [0.18.0] - 2026-05-05 — Verified candidate claim (B6-1)

The pivot from "import every challenger" to "ship with incumbents only and let candidates self-claim against public filings" — phase 1.

### Added
- **`pending_claims` table.** Short-TTL row tying an in-flight claim attempt to a candidate, filing_id, and verification_method (`fec_email` / `registry_email` / `social_proof`). UNIQUE partial index on `(candidate_id) WHERE status='pending'` prevents two users racing into the same magic-link window. Partial index on `contact_email` lets the finalize step look up the right pending claim by the newly-authenticated user's email. Migration `20260505000000_phase1_self_claim.sql`.
- **`candidate_registry` table.** Verification-only registry (separate from `candidates`), populated on-demand by the FEC API path and nightly by the Ballotpedia scraper (B6-3, planned). UNIQUE `(source, filing_id)`.
- **`audit_pending_claim` trigger.** Writes `claim.verification_attempted` on insert and `claim.verification_{succeeded,expired,revoked,failed}` on status transition. SECURITY DEFINER for the same reasons as the S-19 candidate-status trigger.
- **`expire_stale_pending_claims()` + 5-min pg_cron.** Flips pending → expired after the 30-minute TTL. The partial index keeps the scan tiny.
- **`revoke_candidate_claim(uuid, text)` RPC.** Sybil safety valve. Wraps `candidate_claims` DELETE + `candidates.status='unclaimed'` + audit row in one function. Service-role only.
- **`verify-candidate-claim` Edge Function.** Two-action dispatcher (`initiate` + `finalize`).
  - **`initiate`**: requires non-anonymous auth; `check_rate_limit('verify-candidate-claim', 10, 3600)`; resolves candidate by `candidateId`; rejects if not unclaimed, filing_id mismatch, or user already holds a claim. Federal path: cache-first `candidate_registry` (24h TTL) → live `api.open.fec.gov` → committee email. With email: insert `pending_claims` (`fec_email`) + `signInWithOtp` to the FEC-on-file address → `{ status: 'email_sent', emailHint }`. Without email: generate a 9-char proof code, insert `pending_claims` (`social_proof`) → `{ status: 'social_proof_required', code, instructions }`. State and local return 501.
  - **`finalize`**: caller is now authenticated AS the FEC-on-file email (post magic-link). Look up `pending_claims WHERE contact_email = user.email AND status='pending'`. UPDATE → verified (audit trigger fires). INSERT `candidate_claims`. UPDATE `candidates.status='claimed'` guarded on `unclaimed`.
  - First consumer of `_shared/auth.ts` (B6-0). FEC client extracted to `_shared/fec.ts`.
- **Multi-step `ClaimModal`.** Replaces the prior one-tap claim button. Steps: intro → level + filing-ID input → email-sent / social-proof / error. Locked to brand tokens (gold top border, 2px radius, mono filing-ID input).
- **`/app/claim/finalize` route.** Magic-link landing page. Waits for `AUTH_UPGRADED`, calls `service.finalizeCandidateClaim()`, routes to `/app/dashboard` on success. Renders `expired` / `error` states for stale or invalid links.
- **Sybil revoke in `/admin/dedup`.** New "Recent claims · revoke" table lists the 100 most recent `candidate_claims`. Revoke prompts for a reason and calls the new RPC. Audit-logged.
- **`DataService` additions.** `verifyCandidateClaim`, `finalizeCandidateClaim`, `revokeCandidateClaim`. The legacy `claimCandidate` is removed.

### Changed
- **`UnclaimedBanner`** — button now opens the multi-step modal instead of calling the retired `claimCandidate` Edge Function.
- **`usePendingIntentRunner`** — `claim` intent now navigates to `/app/profile/{candidateId}?claim=1` instead of calling `claimCandidate`. The Profile page derives modal-open state from the URL + manual button presses (no setState-in-useEffect).
- **`_shared/auth.ts`** — exports `jsonResponse`, `jsonError`, `JSON_HEADERS` for reuse across Edge Functions.

### Removed
- **`claim-candidate` Edge Function.** Deleted. Was a verification bypass (`verification_method: 'self_attestation'` allowed any authenticated user to claim any candidate). Replaced by `verify-candidate-claim`.

### Notes
- Required Edge Function secret: `FEC_API_KEY` (free, 1000/hr at api.data.gov). Set with `supabase secrets set FEC_API_KEY=<key>`. `PUBLIC_APP_URL` defaults to `https://getrep.org`.
- The magic link in step `initiate` is sent to the FEC-on-file email, not the user's session email. Clicking the link reauthenticates the browser AS that committee address — the verification ceremony IS the email-possession proof. The user's prior Rep session is replaced; this is intentional.
- Phase 5 (social-handle fallback) was promoted to MVP based on the 43% email-on-file audit. The `social_proof_required` branch ships in this commit so phase 5 only fills in the verification UI, not the architecture.

---

## [0.17.0] - 2026-04-19 — Email-gated writes + pending-intent persistence (B5-6/7/8, S-14)

### Added
- **`questions.asked_by` foreign key.** Migration `20260419010000_questions_asked_by.sql` adds a nullable `UUID REFERENCES auth.users(id) ON DELETE SET NULL` column + partial index. Authored questions now have a durable identity that survives device changes and outlives account deletion. No backfill of pre-existing anonymous-era rows; they keep `asked_by = NULL` by design.
- **Email-gate write requirement.** `submit-question` and `vote-question` Edge Functions reject any caller with `user.is_anonymous === true`, returning HTTP 403 `{ code: 'EMAIL_REQUIRED' }`. Closes the loophole where any device-created anonymous user could vote and ask without identity (S-14).
- **`PendingIntent` persistence (`src/utils/pendingIntent.ts`).** Discriminated union (`vote` | `submit-question` | `claim`) stored to localStorage with a 30-minute TTL and per-type validation. Survives the magic-link round-trip into a fresh tab where React state would be reset.
- **`EmailGateProvider` + `EmailGateModal` (`src/components/auth/`).** Global provider exposes `requireEmail({ intent, message })`. Modal is a gold-top-bordered bottom-sheet with email input, sends magic link via `authService.sendMagicLink`, shows a confirmation state. Cancel clears the saved intent.
- **`usePendingIntentRunner`.** Mounts inside the `/app` shell; once `state.authReady && !state.isAnonymous`, pulls the saved intent, replays the call (`voteQuestion` / `submitQuestion` / `claimCandidate`), navigates to `/app/dashboard` after a successful claim, and clears the intent. Single-fire via `useRef`.
- **Wired claim CTA on `UnclaimedBanner`.** "Is this you? Claim this profile" button on every unclaimed candidate profile. On `EmailRequiredError` opens the email gate with a `claim` pending intent so the user lands back on the profile post-verification, claim runs, and they're routed to the dashboard.
- **`EmailRequiredError` + `isEmailRequiredError` (`src/utils/errors.ts`).** Typed error and a helper that pattern-matches FunctionsHttpError → 403 → `{ code: 'EMAIL_REQUIRED' }` body. Used by all three writes.
- **`claimCandidate` on `DataService`.** Real implementation hits `claim-candidate` Edge Function; mock satisfies `ClaimedCandidate` shape (`videoCount: 0`, `positions: []`).

### Changed
- **`usePlusOne`, `useQuestions.submitQuestion`, `ProfileFeedPanel.handleSubmit`** all now catch `EmailRequiredError` and call `requireEmail(...)` with the appropriate pending intent before re-throwing/aborting. Optimistic-update + rollback path on `usePlusOne` was lifted into a named `rollback()` so both error paths share it.
- **`EmailGateProvider` is now mounted at `App.tsx`** above the router, so any view can require email without prop-drilling.

### Notes
- Replay is best-effort: if the replay throws (e.g., the candidate already claimed it from another tab), the intent is dropped silently rather than re-prompting. Surfacing replay errors is a follow-on iteration.
- Tests: `pendingIntent.test.ts` (7), updated `usePlusOne.test.ts` with `EmailRequiredError → pendingIntent` case, all 153 tests green; tsc clean.

---

## [0.16.1] - 2026-04-18 — Editorial seed questions (item 84)

### Added
- **`is_seed` column on `questions` + `seed_question_templates` table.** Migration `20260418050000_seed_questions.sql` introduces an admin-curated catalog of starter questions keyed by district level (federal/state/county/city). 12 seeded entries (3 per level) cover legislative priorities, healthcare, school funding, infrastructure, and city services.
- **`seed_questions_for_candidate(uuid)` SQL function.** Idempotent — re-running it never duplicates seeds. Increments the candidate's denormalized `question_count` for each insert.
- **AFTER INSERT trigger on `candidates`.** Newly-imported candidates (nightly Congress.gov / FEC / OpenStates pipeline, Google Civic election-window upserts) automatically receive their level's seed questions on insert.
- **Backfill of all existing candidates.** 963 seed questions inserted across every candidate currently in the table.
- **`SUGGESTED BY REP.` badge on dashboard inbox rows.** Gold mono text next to the author handle (`@rep_team`) signals the question is editorially curated, not from a constituent.

### Notes
- Sort by `plus_one_count DESC` is unchanged. Seeds start at 0 votes, so any organic question with at least one +1 floats above them. This is intentional: the dashboard inbox is empty for nearly every candidate today, so seeds give claimed candidates something to film against until real questions arrive.
- Editing seed copy is a one-line `UPDATE seed_question_templates SET text = ... WHERE id = ...` from the Supabase SQL console; the next `seed_questions_for_candidate` call will pick up the new wording for any candidate not yet seeded with that exact text.

---

## [0.16.0] - 2026-04-18 — Candidate dashboard with video upload (item 67)

### Added
- **`/app/dashboard` route + `DashboardPage`.** Claimed candidates land on an inbox of unanswered questions sorted by +1 count (desc), plus an "Answered" history section. Header shows avatar, name, office, party, and a CLAIMED status pill. Auth gate redirects to `/app/you` when no claim exists.
- **`InboxQuestionRow` with inline video upload.** Per-question state machine (idle → selected → uploading → error). HTML5 file input with `accept="video/mp4,video/quicktime,video/webm"` + `capture="user"` for mobile camera. 100MB client-side validation, optional caption (280 chars).
- **Supabase Storage `candidate-videos` bucket.** Migration `20260418040000_video_storage.sql` creates the public-read bucket (100MB, mp4/quicktime/webm) with 4 RLS policies: anyone can read, only the authenticated owner of the matching candidate claim can insert/update/delete. Path convention `<candidate_id>/<uuid>.<ext>`; ownership extracted via `split_part(name, '/', 1)`.
- **`submit-video-answer` Edge Function.** Validates inputs, requires non-anonymous auth, rate-limits 30/min via `check_rate_limit`, verifies the caller owns the matching `candidate_claim`, and that the question's `candidate_id` matches. Inserts the video row (post_type='qa-reply', answers_question_id, video_url) and updates `questions.state='answered'` + `answer_video_id` in one round trip.
- **Service contract:** `getMyClaim`, `getDashboardInbox(candidateId)`, `submitVideoAnswer({candidateId, questionId, file, caption?})` on `DataService`. Mock service returns `c-banks` as the demo claim for local dev.
- **Hooks:** `useMyClaim` (single fetch on mount) and `useDashboardInbox(candidateId)` which exposes a `submitAnswer(questionId, file, caption?)` that updates local state on success.
- **You page link.** "Candidate dashboard" button renders only when `useMyClaim()` returns a claim.

### Notes
- Direct client → Storage upload uses the user's auth session so RLS gates writes. Edge Function is the source of truth for the question state transition; if finalize fails the orphan blob is best-effort deleted.
- Editorial seed questions and LLM-generated openers (items 84, 85) are tracked separately — the dashboard is functional with whatever organic constituent questions exist.

---

## [0.15.0] - 2026-04-18 — Profile-first feed (item 76)

### Added
- **Profile-first feed.** New `ProfileFeedPanel` is the default surface inside each district level. Each candidate appears as a card with their top 2 questions inline, a +1 button per question, and an "ask a question" input — no need to tap through to a profile to interact. Voting reuses the same optimistic-update + rollback path as the questions drawer.
- **Batched top-questions query.** New `getTopQuestionsForCandidates(candidateIds, limit)` on `DataService` issues a single `IN`-query (Supabase) or one Map allocation (mock), then trims per-candidate. Powers `useProfileFeed` so a panel of N candidates is one round-trip, not N+1.
- **`ProfileFeedCard` component.** Expanded card built from existing primitives (Avatar, StatusPill, MonoText, PlusOneButton, QuestionInput). Header is a tappable button to the full profile; questions list is read+vote; ask box submits inline.

### Changed
- **`FeedPanelConnected` flips its default.** Video feed now renders only when at least one video exists for the level; `ProfileFeedPanel` is the default for everything else. Previous behavior buried candidates behind a video-loading state that almost always resolved to empty.
- **Removed `CandidatePanel`** (and its CSS) — superseded by `ProfileFeedPanel`. The thinner `CandidateCard` is still used by `DistrictBrowserPage`.

### Notes
- Inline submit failure on a feed card is silent today; the candidate profile view still shows error text. Surfacing inline error UI on the feed card is a follow-on iteration.

---

## [0.14.5] - 2026-04-18 — Security Tier 5 (S-19)

### Added
- **S-19 Audit log.** New migration `20260418030000_audit_log.sql` creates an append-only `audit_log(id, occurred_at, event_type, actor_id, target_table, target_id, old_value, new_value, metadata)` table plus three `SECURITY DEFINER` triggers: `candidates.status` transitions, `candidate_claims` insert/delete, and `user_profiles.handle` changes. Actor resolves via `auth.uid()` (or the row's `user_id` for claim inserts). RLS enabled with zero policies, so only service_role reads — queries run from the Supabase dashboard. Nightly `audit-log-cleanup` pg_cron job prunes entries older than a year.

### Notes
- Admin UI for browsing audit entries is deferred. At launch volume, direct SQL against the table from the dashboard is enough; a dedicated screen costs an Edge Function (RLS denies client reads by design) and isn't worth building before there's real traffic.

---

## [0.14.4] - 2026-04-18 — Security Tier 5 (S-18)

### Added
- **S-18 Rate-limit submit-question.** Mirrors S-15. `submit-question` Edge Function now calls `check_rate_limit` with a tighter budget than votes — 10 submissions/minute per authenticated user — before any candidate lookup or insert. On breach returns 429 with a `Retry-After` header derived from the current window boundary. Reuses the `rate_limit_buckets` table and nightly cleanup from S-15; keyed by endpoint so the two budgets don't interfere.

### Notes
- Limit calibrated on reviewer attention, not compute: a flood of questions costs a candidate's reviewer real time, so submission cadence is capped harder than voting.

---

## [0.14.3] - 2026-04-18 — Security Tier 4 partial (S-15, S-16)

### Added
- **S-16 PWA update prompt.** `vite.config.ts` now uses `registerType: 'prompt'` with `skipWaiting: false` — the new service worker waits in `installed` state until the user confirms. New `UpdatePrompt` component (navy banner, gold primary button) renders globally in `App.tsx`, consuming `virtual:pwa-register/react`'s `needRefresh` signal. `public/_headers` tightens `/sw.js` from `no-cache` to `no-store` so browsers never serve a cached service worker registration script.
- **S-15 Vote rate-limit.** New migration `20260418020000_rate_limit_buckets.sql` adds `rate_limit_buckets(user_id, endpoint, window_start, count)` (composite PK) + `check_rate_limit()` plpgsql RPC returning `(allowed, current_count, retry_after_seconds)`. `vote-question` Edge Function calls the RPC with `limit=30, window_seconds=60`; 429 responses carry a `Retry-After` header. Nightly `rate-limit-buckets-cleanup` pg_cron job prunes windows older than one day.

### Notes
- S-14 (SSE over WebSocket) deferred — gates real-time voting (BACKLOG item 66) which is still an `idea`.

---

## [0.14.2] - 2026-04-18 — Security Tier 2 (S-8, S-9)

### Added
- **S-8 Handle reservation.** New migration `20260418010000_reserved_handles.sql` creates `reserved_handles(handle PK, candidate_id, reason, created_at)` and a `BEFORE UPDATE OF handle` trigger on `user_profiles` that raises `P0001` when the new handle is reserved and the updater isn't the matching `candidate_claims` holder. `scripts/import/seed.ts` now populates reservations — full normalized name (spaces → underscores) and last-name variants — after candidate upsert. `CandidateRow` + `transform.ts` write `normalized_name` so reservation derivation is deterministic from JSON output. `authService.updateHandle` maps `P0001` to a friendly "This handle is reserved for a candidate" message.
- **S-9 Content-Security-Policy.** `public/_headers` now emits a CSP allowlisting self for script/style/connect, Supabase (`https://ocpcejomntxqsboswhrx.supabase.co` + `wss:`), Google Fonts (style + font), `data:` / `https:` for images, and `frame-ancestors 'none'`.

### Notes
- Reservation enforcement is DB-level; clients still update `user_profiles` directly.
- Squatters cannot pre-register a candidate's normalized handle. A candidate claiming their profile (inserting `candidate_claims`) gains the right to their own reserved handles.

---

## [0.14.1] - 2026-04-18 — voterInfoQuery Commit 4 (admin + cache cleanup)

### Added
- `/admin/dedup` route (`src/views/admin/AdminDedupPage.tsx`) — internal read-only surface gated by `VITE_ADMIN_ENABLED=true`. Lists every candidate with `needs_manual_dedup = true`, grouped by district, showing name, normalized name, office, party, status, sources array, and filing/Google IDs. When the flag is absent the route redirects to `/` so production bundles never expose it.
- Migration `20260418000000_voterinfo_cache_cleanup.sql` — enables `pg_cron` (idempotent), unschedules any prior job of the same name, and schedules `voterinfo-cache-cleanup` at `7 3 * * *` running `DELETE FROM public.voterinfo_cache WHERE expires_at < now()`. Complements the opportunistic in-request cleanup already in the Edge Function.

### Notes
- Structured observability logs (`cache_hit`, `google_status`, `contests_count`, `duration_ms`) were already shipping from `proxy-voterinfo` with commits 1-3, completing the commit-4 observability requirement without a code change.
- Commit 5 (FEC retirement) remains indefinitely deferred per the Part 2 decision in `~/.claude/plans/yes-let-s-plan-out-cuddly-moth.md`.

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
