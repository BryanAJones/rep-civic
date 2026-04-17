/**
 * Deno-side mirror of src/utils/normalizeName.ts.
 *
 * MUST stay in sync with:
 *   - src/utils/normalizeName.ts (TS, used by import pipeline + client)
 *   - plpgsql normalize_candidate_name() in
 *     supabase/migrations/20260416000000_voterinfo_integration.sql
 *
 * The parity test at src/utils/normalizeName.test.ts locks behavior via
 * a shared case set; when updating rules, update all three copies and
 * rerun tests.
 */
const SUFFIXES = new Set(['jr', 'sr', 'ii', 'iii', 'iv', 'v']);

export function normalizeName(input: string | null | undefined): string {
  if (!input) return '';

  let s = input.toLowerCase();

  if (s.includes(',')) {
    const comma = s.indexOf(',');
    const last = s.slice(0, comma).trim();
    const first = s.slice(comma + 1).trim();
    s = `${first} ${last}`.trim();
  }

  s = s.replace(/[^\p{L}\p{N}\s-]/gu, '');

  return s
    .split(/\s+/)
    .filter((t) => t.length > 1 && !SUFFIXES.has(t))
    .join(' ');
}
