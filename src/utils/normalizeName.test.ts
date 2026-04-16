import { describe, it, expect } from 'vitest';
import { normalizeName } from './normalizeName';

describe('normalizeName', () => {
  it('returns empty string for null/undefined/empty', () => {
    expect(normalizeName(null)).toBe('');
    expect(normalizeName(undefined)).toBe('');
    expect(normalizeName('')).toBe('');
  });

  it('lowercases input', () => {
    expect(normalizeName('JOHN SMITH')).toBe('john smith');
  });

  it('converts "Last, First" to "First Last"', () => {
    expect(normalizeName('Smith, John')).toBe('john smith');
    expect(normalizeName('Ossoff, Jon')).toBe('jon ossoff');
  });

  it('produces identical output for Congress and Google name formats', () => {
    // The load-bearing invariant: these must collide in the unique index.
    expect(normalizeName('Smith, John D.')).toBe(normalizeName('John D. Smith'));
    expect(normalizeName('Warnock, Raphael G.')).toBe(normalizeName('Raphael G. Warnock'));
    expect(normalizeName('Ossoff, Jon')).toBe(normalizeName('Jon Ossoff'));
  });

  it('strips punctuation', () => {
    expect(normalizeName('John D. Smith')).toBe('john smith');
    expect(normalizeName("O'Brien, Mary")).toBe('mary obrien');
  });

  it('strips single-letter middle initials', () => {
    expect(normalizeName('John D Smith')).toBe('john smith');
    expect(normalizeName('Mary J K Public')).toBe('mary public');
  });

  it('strips suffixes', () => {
    expect(normalizeName('John Smith Jr.')).toBe('john smith');
    expect(normalizeName('John Smith III')).toBe('john smith');
    expect(normalizeName('Henry Smith Sr')).toBe('henry smith');
  });

  it('preserves hyphenated names', () => {
    expect(normalizeName('Mary Jane O-Brien-Lee')).toBe('mary jane o-brien-lee');
  });

  it('preserves two-letter first/last names (not treated as initials)', () => {
    expect(normalizeName('Li Wu')).toBe('li wu');
    expect(normalizeName('Vu Le')).toBe('vu le');
  });

  it('collapses whitespace', () => {
    expect(normalizeName('  John    Smith  ')).toBe('john smith');
  });

  it('handles complex real-world cases', () => {
    expect(normalizeName('Greene, Marjorie Taylor')).toBe('marjorie taylor greene');
    expect(normalizeName('McBath, Lucy')).toBe('lucy mcbath');
    expect(normalizeName('Marjorie Taylor Greene')).toBe('marjorie taylor greene');
  });
});
