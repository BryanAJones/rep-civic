import type { District } from '../types/domain';
import { STATE_NAMES } from '../utils/stateNames';

/**
 * Client-side Geocodio calls are disabled — all district resolution
 * goes through the proxy-geocodio Edge Function (keeps API key server-side).
 * Only mapGeocodioResponse is exported from this module.
 */

// ── Geocodio response types ──────────────────────────────────

interface GeocodioDistrict {
  name: string;
  district_number: number;
  ocd_id: string;
  proportion?: number;
}

interface GeocodioFields {
  congressional_districts?: GeocodioDistrict[];
  state_legislative_districts?: {
    house?: GeocodioDistrict[];
    senate?: GeocodioDistrict[];
  };
}

interface GeocodioResult {
  fields?: GeocodioFields;
}

interface GeocodioResponse {
  results?: GeocodioResult[];
}

// ── Mapping ──────────────────────────────────────────────────

/** Pick the district with the highest proportion (address coverage). */
function pickPrimary(districts: GeocodioDistrict[]): GeocodioDistrict | undefined {
  if (districts.length === 0) return undefined;
  if (districts.length === 1) return districts[0];
  return districts.reduce((best, d) =>
    (d.proportion ?? 0) > (best.proportion ?? 0) ? d : best,
  );
}

function codeFromOcdId(ocdId: string): string {
  return ocdId
    .replace('ocd-division/country:us/', '')
    .replace(/\//g, '-')
    .toUpperCase();
}

export function mapGeocodioResponse(data: GeocodioResponse): District[] {
  const topResult = data.results?.[0];
  if (!topResult?.fields) return [];

  const districts: District[] = [];
  const fields = topResult.fields;

  // Congressional district (federal) — pick primary if multiple returned
  if (fields.congressional_districts) {
    const cd = pickPrimary(fields.congressional_districts);
    if (cd) {
      const code = codeFromOcdId(cd.ocd_id);
      districts.push({
        code,
        level: 'federal',
        officeTitle: `U.S. Representative, District ${cd.district_number}`,
        districtName: cd.name,
        displayLabel: `U.S. Representative · ${code}`,
        candidateIds: [],
      });
    }
  }

  // State legislative districts — pick primary per chamber
  if (fields.state_legislative_districts) {
    const sld = fields.state_legislative_districts;

    if (sld.senate) {
      const s = pickPrimary(sld.senate);
      if (s) {
        const code = codeFromOcdId(s.ocd_id);
        districts.push({
          code,
          level: 'state',
          officeTitle: `State Senator, District ${s.district_number}`,
          districtName: s.name,
          displayLabel: `State Senator · ${code}`,
          candidateIds: [],
        });
      }
    }

    if (sld.house) {
      const h = pickPrimary(sld.house);
      if (h) {
        const code = codeFromOcdId(h.ocd_id);
        districts.push({
          code,
          level: 'state',
          officeTitle: `State Representative, District ${h.district_number}`,
          districtName: h.name,
          displayLabel: `State Representative · ${code}`,
          candidateIds: [],
        });
      }
    }
  }

  // U.S. Senate — derive state from the first district's OCD-ID
  const firstDistrict = districts[0];
  if (firstDistrict) {
    const stateMatch = firstDistrict.code.match(/^STATE:([A-Z]{2})/);
    const st = stateMatch?.[1];
    if (st) {
      const stateCode = `STATE:${st}`;
      const stateName = STATE_NAMES[st] ?? st;
      districts.push({
        code: stateCode,
        level: 'federal',
        officeTitle: 'U.S. Senator',
        districtName: stateName,
        displayLabel: `U.S. Senator · ${stateCode}`,
        candidateIds: [],
      });
    }
  }

  return districts;
}
