# Data Source Outreach — B1-23

Four parallel tracks per plan Part 2 Stage 1. Each has a target, an
asset (email draft / API key register), and a "decision gate" question.

Update each section's **Status** inline as responses come back.

---

## Track 1 — Civic Forge Solutions

**Target:** `https://www.civicforge.solutions/` (Atlanta-based; covers 2,100+ qualified 2026 GA candidates incl. local offices).
**Contact path:** their site's contact form (no public email observed in the research).
**Status:** NOT SENT.

### Email draft

> Subject: Partnership inquiry — civic-accountability PWA, Georgia pre-alpha
>
> Hi Civic Forge team,
>
> I'm building Rep., a civic-accountability platform that connects
> Georgia constituents with the people who represent them — federal,
> state, and local. It's a pre-alpha progressive web app launching first
> in Atlanta (getrep.org — bot page + staging) with a focus on year-round
> engagement, not just election season.
>
> Our current data pipeline covers sitting federal members
> (Congress.gov), federal challengers (FEC), and sitting Georgia state
> legislators (OpenStates). The gap we can't close through free public
> sources is **local offices statewide** — county commissions, city
> councils, school boards — and **state-legislative challengers**
> year-round. Google's Civic Information API closes it for roughly 4-5
> months per year during active election windows, but that leaves the
> remaining 7-8 months dark for local engagement.
>
> Civic Forge Solutions looks like the clearest fit for what we need:
> Georgia-specific, comprehensive, current. I'd love to know:
>
> 1. Is your candidate / officeholder dataset available via API, bulk
>    export, or data licensing?
> 2. If so, what does pricing look like for a pre-revenue civic-tech
>    project? Free / subsidized tiers for non-profits or pre-launch
>    products would be relevant here.
> 3. What's your refresh cadence (daily / weekly / event-driven)?
> 4. Any terms-of-use constraints we should know about up front
>    (re-publishing, attribution, caching windows)?
>
> Happy to hop on a call or share more about the product if useful. If
> this isn't the right path for us yet, any pointers to adjacent
> Georgia-focused datasets would also be appreciated.
>
> Thanks,
> [name]
> Rep. — https://getrep.org

### Decision gate

Does the response offer **statewide GA local-office coverage** at a cost
we can defend? If yes → Track 1 wins. If paid-only at >$1500/yr → treat
as tied with Ballotpedia's paid tier. If no API at all → Track 1 out.

---

## Track 2 — Vote Smart

**Target:** `https://api.votesmart.org/docs/` — public API, no outreach required.
**Contact path:** self-service key registration.
**Status:** NOT REGISTERED.

### Action

1. Register for a Vote Smart API key at their docs site.
2. Test coverage with these calls (Georgia-specific samples):
   - `Officials.getByLastName` for a known GA state senator (e.g.,
     "Jones") — verify GA state-legislature rows are present.
   - `Candidates.getByOfficeState` with `officeId=8` (State
     Legislature) and `stateId=GA` — verify challenger coverage.
   - `Officials.getByOfficeTypeState` with
     `officeTypeId=L` (local) and `stateId=GA` — verify any local
     incumbent data exists.
3. Record: does it cover **challengers** (not just incumbents)? Does it
   cover **local** (city / county / school board)? What's the refresh
   cadence visible from the `lastUpdated` fields?

### Decision gate

Vote Smart wins if it covers state-leg challengers **and** has
meaningful GA local-office data. It historically did not cover local
well; expect this track to close as "partial — cover incumbents only."

---

## Track 3 — Democracy Works Elections API

**Target:** `https://developers.democracy.works/api/v2` — may require paid license.
**Contact path:** their developer portal has an access-request form; fall back to `info@democracy.works` if the form is unresponsive.
**Status:** NOT SENT.

### Email draft (use only if portal form is unresponsive)

> Subject: Elections API access inquiry — civic non-profit use case
>
> Hi Democracy Works team,
>
> I'm building Rep. (https://getrep.org), a civic-accountability PWA
> launching in Georgia with a focus on year-round engagement between
> constituents and elected officials — federal, state, and local. We're
> pre-alpha and pre-revenue.
>
> I'd like to understand what access your Elections API offers for a
> project like ours. Specific questions:
>
> 1. Is there a free or subsidized tier for civic-tech non-profits or
>    pre-revenue public-interest projects?
> 2. If licensing, what does a single-state (Georgia) subscription
>    cost? Statewide coverage of local offices (county commission, city
>    council, school board) is our primary interest; we already have
>    federal and state-legislative incumbents from other sources.
> 3. Does your data include candidates (declared challengers) as well
>    as sitting officeholders?
> 4. Refresh cadence during qualifying / filing windows?
>
> We're specifically comparing our options across public APIs (Google
> Civic, Vote Smart) and licensable data (Ballotpedia, Civic Forge) so
> a concrete answer on fit and pricing would help the decision a lot.
>
> Thanks,
> [name]

### Decision gate

Democracy Works wins if there's a non-profit / pre-revenue tier that
covers GA local offices. If they come back with a standard commercial
quote >$1500/yr, they're out for this round.

---

## Track 4 — Wikidata SPARQL (DONE 2026-04-17)

**Target:** `https://query.wikidata.org/sparql` — free forever.
**Artifact:** `scripts/research/wikidata-ga-officials.rq` (checked in).
**Status:** EVALUATED.

### Findings

- Verified Q-ids for GA House (Q17548315) and GA Senate (Q20065663) via
  Burt Jones (Q19661353) and Stacey Abrams (Q7595813).
- Query returned **10,995 rows** against the federal + state positions.
  The `no end-date` filter does NOT reliably isolate *current* seats:
  many historical records have no P582 qualifier and pass through.
- Most rows carry `bioguide` IDs (federal cross-reference is good) and
  about 8% carry Ballotpedia slugs.
- **No GA local-office coverage worth speaking of** — no
  "member of Fulton County Commission" or similar pattern populated at
  useful density.

### Decision

Wikidata is a **free but noisy incumbent cross-check**, nothing more.
Keep the .rq file for future spot-checks against Congress.gov / OpenStates
imports, but do not treat Wikidata as a primary year-round source.
Close Track 4.

---

## Closing this ticket (B1-23)

When tracks 1-3 each have a definitive yes/no/price answer, update
`BACKLOG.md` B1-23 to **done** and open B1-24 (Source Selection
Decision) with a one-sentence rationale.
