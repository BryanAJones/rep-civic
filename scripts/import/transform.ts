/**
 * Transform raw FEC + OpenStates + Congress.gov data into Rep schema rows.
 *
 * Reads:  scripts/import/data/fec_candidates.txt (pipe-delimited)
 *         scripts/import/data/openstates_ga.csv
 *         scripts/import/data/congress_ga.json
 * Writes: scripts/import/data/districts.json
 *         scripts/import/data/candidates.json
 *
 * Source-joining model (see CLAUDE.md "Backend Architecture"):
 *   - Congress.gov is the authoritative source for sitting federal members.
 *     FEC retains stale incumbents whose committees stay open after they
 *     leave office (e.g., MTG remained in FEC after her 2025 resignation),
 *     so we drop ALL FEC records with CAND_ICI='I' and let congress.gov
 *     supply incumbents instead.
 *   - FEC supplies declared challengers (CAND_ICI != 'I') — preserved to
 *     keep the debate/response mechanic intact.
 *   - OpenStates supplies sitting state legislators.
 *
 * District code format matches Geocodio OCD-IDs (processed through
 * codeFromDivisionId in civicApi.ts):
 *   Federal House: STATE:GA-CD:{n}
 *   Federal Senate: STATE:GA
 *   State House:  STATE:GA-SLDL:{n}
 *   State Senate: STATE:GA-SLDU:{n}
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';
import type { ImportCandidate, DistrictRow, CandidateRow } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');

const ELECTION_YEAR = '2026';       // Must match FEC_CYCLE in download.ts
const GA_MAX_HOUSE_DISTRICT = 14;   // GA has 14 congressional districts (2022 redistricting)

// ── FEC Parsing ──────────────────────────────────────────────

// FEC candidate master file columns (pipe-delimited, no header row)
// Docs: https://www.fec.gov/campaign-finance-data/candidate-master-file/
const FEC_COLUMNS = [
  'CAND_ID',
  'CAND_NAME',
  'CAND_PTY_AFFILIATION',
  'CAND_ELECTION_YR',
  'CAND_OFFICE_ST',
  'CAND_OFFICE',         // H=House, S=Senate, P=President
  'CAND_OFFICE_DISTRICT', // 00 for Senate/President, 01-14 for House
  'CAND_ICI',            // I=Incumbent, C=Challenger, O=Open
  'CAND_STATUS',         // C=Candidate, N=Not yet
  'CAND_PCC',
  'CAND_ST1',
  'CAND_ST2',
  'CAND_CITY',
  'CAND_ST',
  'CAND_ZIP',
] as const;

function parseFecName(raw: string): { name: string; initials: string } {
  // FEC format: "LAST, FIRST MIDDLE" or "LAST, FIRST"
  const parts = raw.split(',').map(s => s.trim());
  const last = parts[0] || '';
  const firstParts = (parts[1] || '').split(/\s+/);
  const first = firstParts[0] || '';

  // Title case
  const tc = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  const name = `${tc(first)} ${tc(last)}`;
  const initials = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  return { name, initials };
}

function normalizeFecParty(code: string): string {
  const map: Record<string, string> = {
    DEM: 'Democratic',
    REP: 'Republican',
    LIB: 'Libertarian',
    GRE: 'Green',
    IND: 'Independent',
    NNE: 'None',
  };
  return map[code] || code;
}

function parseFec(): ImportCandidate[] {
  const raw = readFileSync(join(DATA_DIR, 'fec_candidates.txt'), 'utf-8');
  const lines = raw.split('\n').filter(l => l.trim());

  const candidates: ImportCandidate[] = [];

  for (const line of lines) {
    const fields = line.split('|');
    const record: Record<string, string> = {};
    FEC_COLUMNS.forEach((col, i) => {
      record[col] = (fields[i] || '').trim();
    });

    // Filter: Georgia only, House or Senate, current election cycle, active candidates
    if (record.CAND_OFFICE_ST !== 'GA') continue;
    if (record.CAND_OFFICE !== 'H' && record.CAND_OFFICE !== 'S') continue;
    if (record.CAND_ELECTION_YR !== ELECTION_YEAR) continue;
    if (record.CAND_STATUS !== 'C') continue;

    // Drop FEC incumbents — congress.gov is the authoritative source for
    // sitting members. FEC keeps candidates whose committees remain open
    // after they leave office (e.g., MTG after her 2025 resignation), so
    // trusting FEC 'I' records would resurface stale incumbents.
    if (record.CAND_ICI === 'I') continue;

    // Filter: valid GA House districts only (1-14)
    if (record.CAND_OFFICE === 'H') {
      const dist = parseInt(record.CAND_OFFICE_DISTRICT, 10);
      if (dist < 1 || dist > GA_MAX_HOUSE_DISTRICT) continue;
    }

    const { name, initials } = parseFecName(record.CAND_NAME);
    const distNum = parseInt(record.CAND_OFFICE_DISTRICT, 10);

    let districtCode: string;
    let officeTitle: string;

    if (record.CAND_OFFICE === 'H') {
      districtCode = `STATE:GA-CD:${distNum}`;
      officeTitle = `U.S. Representative, District ${distNum}`;
    } else {
      // Senate — at-large, both seats share one district code
      districtCode = 'STATE:GA';
      officeTitle = 'U.S. Senator';
    }

    candidates.push({
      sourceId: record.CAND_ID,
      source: 'fec',
      name,
      initials,
      party: normalizeFecParty(record.CAND_PTY_AFFILIATION),
      officeTitle,
      districtCode,
      level: 'federal',
      isIncumbent: false, // All FEC records here are challengers — incumbents filtered out above
    });
  }

  return candidates;
}

// ── Congress.gov Parsing ─────────────────────────────────────

// Matches the shape written by download.ts — only fields consumed downstream.
interface CongressMemberRaw {
  bioguideId: string;
  name: string;          // "Last, First M."
  partyName: string;     // "Democratic" | "Republican" | "Independent"
  state: string;         // "Georgia"
  district?: number;     // House only
  terms: {
    item: { chamber: 'House of Representatives' | 'Senate'; startYear: number; endYear?: number }[];
  };
}

function parseCongressName(raw: string): { name: string; initials: string } {
  // Congress.gov format matches FEC: "LAST, FIRST M." — reuse the FEC parser.
  return parseFecName(raw);
}

function normalizeCongressParty(party: string): string {
  // Congress.gov returns full names already ("Democratic", "Republican", "Independent")
  const lower = party.toLowerCase();
  if (lower.includes('democrat')) return 'Democratic';
  if (lower.includes('republican')) return 'Republican';
  if (lower.includes('independent')) return 'Independent';
  if (lower.includes('libertarian')) return 'Libertarian';
  if (lower.includes('green')) return 'Green';
  return party;
}

function parseCongress(): ImportCandidate[] {
  const path = join(DATA_DIR, 'congress_ga.json');
  const raw = readFileSync(path, 'utf-8');
  const members = JSON.parse(raw) as CongressMemberRaw[];

  const candidates: ImportCandidate[] = [];

  for (const m of members) {
    // Determine current chamber from the most recent term.
    // terms.item is ordered chronologically, so take the last entry.
    const termItems = m.terms?.item ?? [];
    const currentTerm = termItems[termItems.length - 1];
    if (!currentTerm) continue;

    const { name, initials } = parseCongressName(m.name);
    const party = normalizeCongressParty(m.partyName);

    let districtCode: string;
    let officeTitle: string;

    if (currentTerm.chamber === 'Senate') {
      districtCode = 'STATE:GA';
      officeTitle = 'U.S. Senator';
    } else {
      // House — district is required
      if (m.district === undefined) {
        console.warn(`  Skipping ${m.name}: House member with no district`);
        continue;
      }
      districtCode = `STATE:GA-CD:${m.district}`;
      officeTitle = `U.S. Representative, District ${m.district}`;
    }

    candidates.push({
      sourceId: m.bioguideId,
      source: 'congress',
      name,
      initials,
      party,
      officeTitle,
      districtCode,
      level: 'federal',
      isIncumbent: true,
    });
  }

  return candidates;
}

// ── OpenStates Parsing ───────────────────────────────────────

function parseOpenStates(): ImportCandidate[] {
  const raw = readFileSync(join(DATA_DIR, 'openstates_ga.csv'), 'utf-8');
  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  }) as Record<string, string>[];

  const candidates: ImportCandidate[] = [];

  for (const rec of records) {
    // OpenStates CSV columns vary slightly — handle common variants
    const name = rec.name || rec.Name || '';
    const party = rec.current_party || rec.party || '';
    const chamber = rec.current_role || rec.current_chamber || '';
    const district = rec.current_district || rec.district || '';
    const givenName = rec.given_name || '';
    const familyName = rec.family_name || '';

    if (!name || !district) continue;

    const distNum = parseInt(district, 10);
    const isUpper = chamber.toLowerCase().includes('upper');

    let districtCode: string;
    let officeTitle: string;

    if (isUpper) {
      districtCode = `STATE:GA-SLDU:${distNum}`;
      officeTitle = `State Senator, District ${distNum}`;
    } else {
      districtCode = `STATE:GA-SLDL:${distNum}`;
      officeTitle = `State Representative, District ${distNum}`;
    }

    // Initials from given/family if available, otherwise from full name
    let initials: string;
    if (givenName && familyName) {
      initials = `${givenName.charAt(0)}${familyName.charAt(0)}`.toUpperCase();
    } else {
      const parts = name.split(/\s+/);
      initials = `${parts[0]?.charAt(0) || ''}${parts[parts.length - 1]?.charAt(0) || ''}`.toUpperCase();
    }

    candidates.push({
      sourceId: rec.id || rec.leg_id || '',
      source: 'openstates',
      name,
      initials,
      party: normalizeOpenStatesParty(party),
      officeTitle,
      districtCode,
      level: 'state',
      isIncumbent: true, // OpenStates supplies current sitting legislators
    });
  }

  return candidates;
}

function normalizeOpenStatesParty(party: string): string {
  const lower = party.toLowerCase();
  if (lower.includes('democrat')) return 'Democratic';
  if (lower.includes('republican')) return 'Republican';
  if (lower.includes('libertarian')) return 'Libertarian';
  if (lower.includes('green')) return 'Green';
  if (lower.includes('independent')) return 'Independent';
  return party;
}

// ── District Generation ──────────────────────────────────────

function generateDistricts(candidates: ImportCandidate[]): DistrictRow[] {
  const seen = new Map<string, DistrictRow>();

  for (const c of candidates) {
    if (seen.has(c.districtCode)) continue;

    let districtName: string;
    if (c.districtCode === 'STATE:GA') {
      districtName = 'Georgia';
    } else {
      // Extract the last segment as the district name
      const lastPart = c.districtCode.split('-').pop() || c.districtCode;
      districtName = lastPart.replace(':', ' ');
    }

    seen.set(c.districtCode, {
      code: c.districtCode,
      level: c.level,
      office_title: c.officeTitle,
      district_name: districtName,
      display_label: `${c.officeTitle} · ${c.districtCode}`,
    });
  }

  return Array.from(seen.values());
}

// ── Opponent Counting ────────────────────────────────────────

function countOpponents(candidates: ImportCandidate[]): Map<string, number> {
  // Count how many candidates share each district
  const districtCounts = new Map<string, number>();
  for (const c of candidates) {
    districtCounts.set(c.districtCode, (districtCounts.get(c.districtCode) || 0) + 1);
  }
  return districtCounts;
}

// ── Main ─────────────────────────────────────────────────────

function main() {
  console.log('=== Rep. Data Import — Transform ===\n');

  const congressCandidates = parseCongress();
  console.log(`Congress.gov: ${congressCandidates.length} sitting GA federal members`);

  const fecCandidates = parseFec();
  console.log(`FEC: ${fecCandidates.length} GA federal challengers (incumbents dropped)`);

  const osCandidates = parseOpenStates();
  console.log(`OpenStates: ${osCandidates.length} GA state legislators`);

  // Order matters for dedup: incumbents first so they win ties against any
  // challenger record that happens to share a name + district.
  const allCandidates = [...congressCandidates, ...fecCandidates, ...osCandidates];
  console.log(`Total: ${allCandidates.length} candidates\n`);

  // Generate districts
  const districts = generateDistricts(allCandidates);
  console.log(`Districts: ${districts.length} unique`);

  // Count opponents per district
  const opponentCounts = countOpponents(allCandidates);

  // Build candidate rows
  const candidateRows: CandidateRow[] = allCandidates.map(c => ({
    name: c.name,
    initials: c.initials,
    office_title: c.officeTitle,
    district_code: c.districtCode,
    party: c.party,
    status: 'unclaimed' as const,
    filing_id: c.sourceId || null,
    filing_date: null,
    opponent_count: (opponentCounts.get(c.districtCode) || 1) - 1,
  }));

  // Deduplicate: same name + same district = keep one
  const deduped = new Map<string, CandidateRow>();
  for (const row of candidateRows) {
    const key = `${row.name.toLowerCase()}|${row.district_code}`;
    if (!deduped.has(key)) {
      deduped.set(key, row);
    }
  }
  const finalCandidates = Array.from(deduped.values());
  console.log(`Candidates after dedup: ${finalCandidates.length}`);

  // Write output
  const distPath = join(DATA_DIR, 'districts.json');
  const candPath = join(DATA_DIR, 'candidates.json');

  writeFileSync(distPath, JSON.stringify(districts, null, 2));
  writeFileSync(candPath, JSON.stringify(finalCandidates, null, 2));

  console.log(`\nWrote ${distPath}`);
  console.log(`Wrote ${candPath}`);

  // Summary by level
  const byLevel = new Map<string, number>();
  for (const c of finalCandidates) {
    const level = c.district_code.includes('SLDL') || c.district_code.includes('SLDU') ? 'state' : 'federal';
    byLevel.set(level, (byLevel.get(level) || 0) + 1);
  }
  console.log('\nBreakdown:');
  for (const [level, count] of byLevel) {
    console.log(`  ${level}: ${count} candidates`);
  }

  console.log('\nNext step: npm run import:seed');
}

main();
