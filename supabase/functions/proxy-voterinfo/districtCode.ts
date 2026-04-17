/**
 * Map Google Civic Information API district descriptors to OCD-style
 * district codes matching existing Geocodio output (e.g., STATE:GA-CD:5).
 *
 * Convention: colon-separated, uppercase, single-hyphen-joined components.
 * Levels mirror src/types/domain.ts DistrictLevel ('federal' | 'state' |
 * 'county' | 'city').
 *
 * See the plan's "District Code Mapping" section for the canonical table.
 */

export type DistrictLevel = 'federal' | 'state' | 'county' | 'city';

export interface MappedDistrict {
  code: string;
  level: DistrictLevel;
  officeTitle: string;
  districtName: string;
  displayLabel: string;
  scope: string;
  externalId?: string;
}

interface GoogleDistrict {
  name: string;
  scope: string;
  id?: string;
}

interface MapInput {
  district: GoogleDistrict;
  office?: string;
  ballotTitle?: string;
  stateAbbr: string; // 'GA' for the pre-alpha launch
}

// Allowlists are intentionally unused in commit 2 — the normalizeJurisdiction
// function produces deterministic keys for any input, and we accept whatever
// Google returns. When unexpected jurisdictions start appearing in practice
// (commit 4 observability), we'll add a soft-warn path that consults these
// lists to flag the row via needs_manual_dedup.

/** Normalize a jurisdiction name (county/city) to an allowlisted key. */
export function normalizeJurisdiction(name: string): string {
  return name
    .toUpperCase()
    .replace(/\bCOUNTY\b/g, '')
    .replace(/\bCITY OF\b/g, '')
    .replace(/[^A-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

/** Extract a numeric district from Google's district.id or district.name. */
function extractDistrictNumber(
  district: GoogleDistrict,
  fallbackName?: string,
): string | undefined {
  // Google's district.id is often an OCD-ID like
  // "ocd-division/country:us/state:ga/cd:5"
  if (district.id) {
    const match = district.id.match(/[:=](\d+)$/);
    if (match) return match[1];
  }
  const source = fallbackName ?? district.name;
  const numMatch = source.match(/\b(\d{1,3})\b/);
  return numMatch?.[1];
}

/** Strip a trailing "District N" suffix from office titles to avoid redundancy. */
function cleanOfficeTitle(input: string): string {
  return input.replace(/\s*-?\s*District\s+\d+\s*$/i, '').trim();
}

function buildTitle(input: MapInput): string {
  const source = input.ballotTitle ?? input.office ?? input.district.name;
  return cleanOfficeTitle(source);
}

export function mapDistrict(input: MapInput): MappedDistrict | null {
  const { district, stateAbbr } = input;
  const scope = district.scope;

  const baseTitle = buildTitle(input);
  const externalId = district.id;

  switch (scope) {
    case 'national': {
      // President — handled as a single US-level entity.
      const code = 'US';
      return {
        code,
        level: 'federal',
        officeTitle: baseTitle || 'President of the United States',
        districtName: 'United States',
        displayLabel: `${baseTitle || 'President'} · ${code}`,
        scope,
        externalId,
      };
    }

    case 'statewide': {
      const code = `STATE:${stateAbbr}`;
      return {
        code,
        level: 'federal',
        officeTitle: baseTitle,
        districtName: district.name,
        displayLabel: `${baseTitle} · ${code}`,
        scope,
        externalId,
      };
    }

    case 'congressional': {
      const num = extractDistrictNumber(district);
      if (!num) return null;
      const code = `STATE:${stateAbbr}-CD:${num}`;
      return {
        code,
        level: 'federal',
        officeTitle: baseTitle || `U.S. Representative, District ${num}`,
        districtName: district.name,
        displayLabel: `${baseTitle || 'U.S. Representative'} · ${code}`,
        scope,
        externalId,
      };
    }

    case 'stateUpper': {
      const num = extractDistrictNumber(district);
      if (!num) return null;
      const code = `STATE:${stateAbbr}-SLDU:${num}`;
      return {
        code,
        level: 'state',
        officeTitle: baseTitle || `State Senator, District ${num}`,
        districtName: district.name,
        displayLabel: `${baseTitle || 'State Senator'} · ${code}`,
        scope,
        externalId,
      };
    }

    case 'stateLower': {
      const num = extractDistrictNumber(district);
      if (!num) return null;
      const code = `STATE:${stateAbbr}-SLDL:${num}`;
      return {
        code,
        level: 'state',
        officeTitle: baseTitle || `State Representative, District ${num}`,
        districtName: district.name,
        displayLabel: `${baseTitle || 'State Representative'} · ${code}`,
        scope,
        externalId,
      };
    }

    case 'countywide': {
      const county = normalizeJurisdiction(district.name);
      const code = `COUNTY:${stateAbbr}-${county}`;
      return {
        code,
        level: 'county',
        officeTitle: baseTitle,
        districtName: district.name,
        displayLabel: `${baseTitle} · ${code}`,
        scope,
        externalId,
      };
    }

    case 'cityWide': {
      const city = normalizeJurisdiction(district.name);
      const code = `CITY:${stateAbbr}-${city}`;
      return {
        code,
        level: 'city',
        officeTitle: baseTitle,
        districtName: district.name,
        displayLabel: `${baseTitle} · ${code}`,
        scope,
        externalId,
      };
    }

    case 'cityCouncil':
    case 'ward': {
      const num = extractDistrictNumber(district, district.name);
      // City council districts often embed the city name in district.name,
      // e.g., "Atlanta City Council District 2" — extract it.
      const cityMatch = district.name.match(/^(.+?)\s+City Council/i);
      const cityRaw = cityMatch?.[1] ?? '';
      const city = cityRaw ? normalizeJurisdiction(cityRaw) : 'UNKNOWN';
      const code = num
        ? `CITY:${stateAbbr}-${city}-COUNCIL:${num}`
        : `CITY:${stateAbbr}-${city}-COUNCIL`;
      return {
        code,
        level: 'city',
        officeTitle: baseTitle,
        districtName: district.name,
        displayLabel: `${baseTitle} · ${code}`,
        scope,
        externalId,
      };
    }

    case 'countyCouncil': {
      const num = extractDistrictNumber(district, district.name);
      const countyMatch = district.name.match(/^(.+?)\s+(?:County\s+)?Commission/i);
      const county = countyMatch?.[1]
        ? normalizeJurisdiction(countyMatch[1])
        : 'UNKNOWN';
      const code = num
        ? `COUNTY:${stateAbbr}-${county}-COMMISSION:${num}`
        : `COUNTY:${stateAbbr}-${county}-COMMISSION`;
      return {
        code,
        level: 'county',
        officeTitle: baseTitle,
        districtName: district.name,
        displayLabel: `${baseTitle} · ${code}`,
        scope,
        externalId,
      };
    }

    case 'judicial': {
      // "Atlanta Judicial Circuit" → "ATLANTA"
      const trimmed = district.name.replace(/\s+Judicial(\s+Circuit)?$/i, '');
      const circuit = normalizeJurisdiction(trimmed);
      const code = `JUDICIAL:${stateAbbr}-${circuit}`;
      return {
        code,
        level: 'state',
        officeTitle: baseTitle,
        districtName: district.name,
        displayLabel: `${baseTitle} · ${code}`,
        scope,
        externalId,
      };
    }

    case 'schoolBoard': {
      const num = extractDistrictNumber(district, district.name);
      const jurisMatch = district.name.match(/^(.+?)\s+(?:County\s+)?(?:Board|Schools)/i);
      const juris = jurisMatch?.[1]
        ? normalizeJurisdiction(jurisMatch[1])
        : 'UNKNOWN';
      const code = num
        ? `SCHOOL:${stateAbbr}-${juris}-${num}`
        : `SCHOOL:${stateAbbr}-${juris}`;
      return {
        code,
        level: 'city',
        officeTitle: baseTitle,
        districtName: district.name,
        displayLabel: `${baseTitle} · ${code}`,
        scope,
        externalId,
      };
    }

    default:
      return null;
  }
}

/**
 * Derive a US Senate district code from an observed state abbreviation.
 * Google returns US Senate contests as `scope: 'statewide'` with no
 * district number, so the regular mapping already handles it via the
 * STATE:GA code.
 */
export function usSenateCode(stateAbbr: string): string {
  return `STATE:${stateAbbr}`;
}
