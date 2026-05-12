# Dogfooding the first real candidate

A one-page checklist for the first real candidate claim. The product hypothesis — "a candidate, seeing their own auto-generated profile, will self-claim against public filings to control their narrative" — is completely untested. The first real attempt is the highest-leverage piece of product evidence Rep can collect right now. Treat it accordingly: instrumented, observed, and unhurried.

---

## Pre-flight (before reaching out)

- [ ] **SMTP is configured.** Follow `docs/SMTP_SETUP.md` end-to-end. Without it the candidate will hit `OTP_RATE_LIMIT` and see a confusing rate-limit message instead of receiving the verification email. This is the single most likely thing to silently kill the dogfood.
- [ ] **Verify the test claim works from a fresh device.** Run `scripts/seed-test-claim.ts` against an email you control. Complete the flow on a phone you have not used to test before. If anything looks broken — wrong copy, broken layout, slow load — fix it first. The first real candidate sees this UI cold; there is no second first impression.
- [ ] **Pick a candidate.** Ideal first dogfood: someone you know personally enough to walk through it on a call, who is mid-tier visibility (not so famous they delegate to staff, not so unknown they have nothing to gain). GA-5 / GA-7 / GA-13 challengers are good starting universe.
- [ ] **Confirm the candidate has a FEC email on file.** Look them up at https://www.fec.gov/data/candidate/&lt;FILING_ID&gt;/ — the committee email is on the committee page. If absent, you have hit the 57% gap and need B6-5 social-handle fallback first.

## During the dogfood

- [ ] **Walk through the flow live.** On a call, screen-share, or in person. Open https://getrep.org → onboarding → their profile → "Is this you? Claim this profile" → filing-ID entry → magic-link send → click link → land at `/app/claim/finalize` → routed to dashboard.
- [ ] **Take notes on every friction point.** Where they paused. What they asked. Which copy was unclear. Whether the gold/navy aesthetic registered as "official" or "weird." These are gold; write them down verbatim.
- [ ] **Watch the error states.** If they hit any error, ask them to tap "Copy diagnostics" (B6-12 just shipped this). Save the captured JSON.
- [ ] **Do not over-explain.** Resist coaching them through every step. If they get stuck and you have to explain something, that is a UX bug — write it down.

## Immediately after

- [ ] **Capture five questions.** Their five most expected questions from constituents. Add them to their inbox manually if seed-question coverage is thin — or note which seed questions resonated.
- [ ] **Ask them to record one video answer.** Even a 30-second test. This validates the candidate-side loop (dashboard → upload → published). If the upload UX has friction, write it down.
- [ ] **Send them their profile share link.** Ask if they would actually share it. Listen to the hedges. "I would if it had..." is the most valuable sentence they can say.

## What to watch for in the first 7 days post-dogfood

- [ ] Do they share the profile anywhere?
- [ ] Do any constituents +1 their seed questions, or ask new questions?
- [ ] Do they log back in unprompted?
- [ ] Does the candidate forward Rep to anyone else?

Each "yes" is evidence of pull. Each "no" with no explanation is a hole in the product hypothesis that needs investigation, not a fix to write.

---

## Honest framing

One real claim is not a launch. It is one data point. The job is not to land 100 candidates — it is to learn whether the loop closes for one. Once it closes for one, scaling the inventory (B6-3) and verification surface (B6-4, B6-8) becomes a real engineering question instead of a speculative one.

If after two or three dogfood attempts the loop does not close, the right move is not to build more — it is to revisit the premise.
