import type { District } from '../types/domain';

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

  // Congressional districts (federal)
  if (fields.congressional_districts) {
    for (const cd of fields.congressional_districts) {
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

  // State legislative districts
  if (fields.state_legislative_districts) {
    const sld = fields.state_legislative_districts;

    if (sld.senate) {
      for (const s of sld.senate) {
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
      for (const h of sld.house) {
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

  // U.S. Senate — always add for Georgia addresses (both seats, shared district code)
  if (districts.length > 0) {
    districts.push({
      code: 'STATE:GA',
      level: 'federal',
      officeTitle: 'U.S. Senator',
      districtName: 'Georgia',
      displayLabel: 'U.S. Senator · STATE:GA',
      candidateIds: [],
    });
  }

  return districts;
}
