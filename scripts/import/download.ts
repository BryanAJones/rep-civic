/**
 * Download raw data files for GA candidate import.
 *
 * Sources:
 * 1. FEC candidate master file (federal: declared challengers)
 *    - Pipe-delimited text inside a zip archive
 *    - https://www.fec.gov/files/bulk-downloads/{year}/cn{yy}.zip
 *    - Used for challengers only. Incumbents here are unreliable because the
 *      FEC retains candidates whose committees stay open, even after they
 *      withdraw or resign. Congress.gov is the authoritative source for
 *      sitting members (see #3).
 *
 * 2. OpenStates current legislators CSV (state: sitting GA House + Senate)
 *    - Standard CSV with headers
 *    - https://data.openstates.org/people/current/ga.csv
 *    - Authoritative source for state-level sitting legislators.
 *
 * 3. Congress.gov /member API (federal: sitting GA House + Senate)
 *    - JSON, requires free CONGRESS_API_KEY (5000 req/hr rate limit)
 *    - https://api.congress.gov/v3/member/GA?currentMember=true
 *    - Authoritative source for federal sitting members. The transform step
 *      joins FEC challengers against this list to exclude stale incumbents.
 *
 * Output:
 *   scripts/import/data/fec_candidates.txt  (FEC raw pipe-delimited)
 *   scripts/import/data/openstates_ga.csv   (OpenStates raw CSV)
 *   scripts/import/data/congress_ga.json    (Congress.gov normalized JSON)
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');

const FEC_CYCLE = 2026;
const FEC_URL = `https://www.fec.gov/files/bulk-downloads/${FEC_CYCLE}/cn${String(FEC_CYCLE).slice(-2)}.zip`;
const OPENSTATES_URL = 'https://data.openstates.org/people/current/ga.csv';
const CONGRESS_STATE = 'GA';
const CONGRESS_API_BASE = 'https://api.congress.gov/v3';

async function downloadBuffer(url: string, label: string): Promise<Buffer> {
  console.log(`Downloading ${label}...`);
  console.log(`  URL: ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download ${label}: ${res.status} ${res.statusText}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  console.log(`  Downloaded ${(buffer.length / 1024).toFixed(0)} KB`);
  return buffer;
}

async function downloadFec(): Promise<void> {
  const zipBuffer = await downloadBuffer(FEC_URL, 'FEC candidate master');
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();

  // The zip contains a single file, typically cn.txt
  const cnEntry = entries.find(e => e.entryName.endsWith('.txt'));
  if (!cnEntry) {
    // List what's in the zip for debugging
    console.error('Zip contents:', entries.map(e => e.entryName));
    throw new Error('Could not find .txt file in FEC zip archive');
  }

  const outPath = join(DATA_DIR, 'fec_candidates.txt');
  writeFileSync(outPath, cnEntry.getData());
  console.log(`  Extracted ${cnEntry.entryName} → ${outPath}`);
}

async function downloadOpenStates(): Promise<void> {
  const csvBuffer = await downloadBuffer(OPENSTATES_URL, 'OpenStates GA legislators');
  const outPath = join(DATA_DIR, 'openstates_ga.csv');
  writeFileSync(outPath, csvBuffer);
  console.log(`  Saved → ${outPath}`);
}

// ── Congress.gov ──────────────────────────────────────────────
//
// Minimal shape of the fields we consume from the /member endpoint.
// The full response has many more fields (depiction, updateDate, etc.);
// we only extract what the transform step needs.
interface CongressMember {
  bioguideId: string;
  name: string;          // "Last, First M."
  partyName: string;     // "Democratic" | "Republican" | "Independent"
  state: string;         // Full name, e.g. "Georgia"
  district?: number;     // House only; Senate members have no district
  terms: {
    item: { chamber: 'House of Representatives' | 'Senate'; startYear: number; endYear?: number }[];
  };
}

interface CongressResponse {
  members: CongressMember[];
  pagination?: { count: number; next?: string };
}

async function downloadCongress(): Promise<void> {
  const apiKey = process.env.CONGRESS_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Missing CONGRESS_API_KEY. Set it in .env (scripts loaded via tsx --env-file=.env) ' +
      'or export it in your shell. Register for a free key at https://gpo.congress.gov/',
    );
  }

  console.log('Downloading Congress.gov current members...');
  console.log(`  URL: ${CONGRESS_API_BASE}/member/${CONGRESS_STATE}?currentMember=true`);

  // Paginate through all results (GA has ~15, well under one page, but be
  // defensive in case we ever widen the import to all 50 states)
  const members: CongressMember[] = [];
  let offset = 0;
  const limit = 250;

  while (true) {
    const url = new URL(`${CONGRESS_API_BASE}/member/${CONGRESS_STATE}`);
    url.searchParams.set('currentMember', 'true');
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('offset', String(offset));
    url.searchParams.set('api_key', apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`Congress.gov API error: ${res.status} ${res.statusText}`);
    }
    const data = (await res.json()) as CongressResponse;
    members.push(...data.members);

    if (!data.pagination?.next || data.members.length < limit) break;
    offset += limit;
  }

  console.log(`  Fetched ${members.length} current ${CONGRESS_STATE} members`);
  const outPath = join(DATA_DIR, 'congress_ga.json');
  writeFileSync(outPath, JSON.stringify(members, null, 2));
  console.log(`  Saved → ${outPath}`);
}

async function main() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  console.log('=== Rep. Data Import — Download ===\n');

  await downloadFec();
  console.log();
  await downloadOpenStates();
  console.log();
  await downloadCongress();

  console.log('\nDone. Raw files saved to scripts/import/data/');
  console.log('Next step: npm run import:transform');
}

main().catch((err) => {
  console.error('\nDownload failed:', err.message);
  process.exit(1);
});
