import type { District } from '../types/domain';

const CIVIC_API_BASE = 'https://civicinfo.googleapis.com/civicinfo/v2/representatives';

export async function resolveDistricts(address: string): Promise<District[]> {
  const apiKey = import.meta.env.VITE_CIVIC_API_KEY;

  if (!apiKey) {
    console.warn('VITE_CIVIC_API_KEY not set — district resolution unavailable.');
    return [];
  }

  const url = new URL(CIVIC_API_BASE);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('address', address);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Civic API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return mapCivicResponse(data);
}

interface CivicOffice {
  name: string;
  divisionId: string;
  levels?: string[];
  officialIndices: number[];
}

interface CivicApiResponse {
  offices: CivicOffice[];
}

function levelFromDivisionId(divisionId: string, officeName: string): District['level'] {
  if (divisionId.includes('place') || divisionId.includes('city')) return 'city';
  if (divisionId.includes('county')) return 'county';
  if (divisionId.includes('state') && !divisionId.includes('cd:')) return 'state';
  if (divisionId.includes('cd:') || officeName.toLowerCase().includes('u.s.')) return 'federal';
  return 'state';
}

function codeFromDivisionId(divisionId: string): string {
  return divisionId
    .replace('ocd-division/country:us/', '')
    .replace(/\//g, '-')
    .toUpperCase();
}

function mapCivicResponse(data: CivicApiResponse): District[] {
  if (!data.offices) return [];

  return data.offices.map((office) => {
    const code = codeFromDivisionId(office.divisionId);
    const level = levelFromDivisionId(office.divisionId, office.name);

    return {
      code,
      level,
      officeTitle: office.name,
      districtName: code,
      displayLabel: `${office.name} · ${code}`,
      candidateIds: [],
    };
  });
}
