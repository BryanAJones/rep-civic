/**
 * Canonical candidate-name normalizer shared across:
 *   - Import pipeline (scripts/import/transform.ts)
 *   - proxy-voterinfo Edge Function (Deno)
 *   - SQL migration backfill (mirrored in plpgsql `normalize_candidate_name`)
 *
 * The three implementations MUST stay in sync. The parity test in
 * normalizeName.test.ts and the live-data test in proxy-voterinfo enforce
 * this — if any diverges, incumbent rows from different sources will fail
 * to collide and will appear twice in the onboarding cascade.
 *
 * Rules (applied in order):
 *   1. Lowercase.
 *   2. "Last, First M." → "First M. Last" (Congress.gov uses the reversed form).
 *   3. Strip punctuation except spaces and hyphens.
 *   4. Drop single-character tokens (middle initials).
 *   5. Drop suffix tokens: jr, sr, ii, iii, iv, v.
 *   6. Collapse whitespace.
 */
const SUFFIXES = new Set(['jr', 'sr', 'ii', 'iii', 'iv', 'v']);

export function normalizeName(input: string | null | undefined): string {
  if (!input) return '';

  let s = input.toLowerCase();

  // "Smith, John D." → "John D. Smith"
  if (s.includes(',')) {
    const comma = s.indexOf(',');
    const last = s.slice(0, comma).trim();
    const first = s.slice(comma + 1).trim();
    s = `${first} ${last}`.trim();
  }

  // Keep only letters, digits, spaces, hyphens. Unicode letters are
  // intentionally preserved via \p{L} so names like "O'Brien" (after
  // apostrophe strip → "obrien") and "Núñez" survive.
  s = s.replace(/[^\p{L}\p{N}\s-]/gu, '');

  return s
    .split(/\s+/)
    .filter((t) => t.length > 1 && !SUFFIXES.has(t))
    .join(' ');
}
