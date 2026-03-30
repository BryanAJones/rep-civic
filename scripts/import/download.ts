/**
 * Download raw data files for GA candidate import.
 *
 * Sources:
 * 1. FEC candidate master file (federal: US House + Senate)
 *    - Pipe-delimited text inside a zip archive
 *    - https://www.fec.gov/files/bulk-downloads/{year}/cn{yy}.zip
 *
 * 2. OpenStates current legislators CSV (state: GA House + Senate)
 *    - Standard CSV with headers
 *    - https://data.openstates.org/people/current/ga.csv
 *
 * Output: scripts/import/data/cn.txt and scripts/import/data/ga.csv
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

async function main() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  console.log('=== Rep. Data Import — Download ===\n');

  await downloadFec();
  console.log();
  await downloadOpenStates();

  console.log('\nDone. Raw files saved to scripts/import/data/');
  console.log('Next step: npm run import:transform');
}

main().catch((err) => {
  console.error('\nDownload failed:', err.message);
  process.exit(1);
});
