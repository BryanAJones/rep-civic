import { describe, it, expect } from 'vitest';
import { mapDistrict, normalizeJurisdiction } from './districtCode';

/**
 * Runs under vitest (Node) against the Deno source file. Imports are
 * pure TypeScript with no Deno-specific runtime calls, so the file is
 * safely evaluable by the Node test runner as well.
 */

describe('mapDistrict', () => {
  it('maps national scope to US code', () => {
    const result = mapDistrict({
      district: { name: 'United States', scope: 'national' },
      ballotTitle: 'President of the United States',
      stateAbbr: 'GA',
    });
    expect(result?.code).toBe('US');
    expect(result?.level).toBe('federal');
  });

  it('maps statewide scope (US Senate)', () => {
    const result = mapDistrict({
      district: { name: 'Georgia', scope: 'statewide' },
      ballotTitle: 'United States Senator',
      stateAbbr: 'GA',
    });
    expect(result?.code).toBe('STATE:GA');
    expect(result?.level).toBe('federal');
  });

  it('maps congressional scope with numeric district', () => {
    const result = mapDistrict({
      district: {
        name: "Georgia's 5th congressional district",
        scope: 'congressional',
        id: 'ocd-division/country:us/state:ga/cd:5',
      },
      ballotTitle: 'United States Representative',
      stateAbbr: 'GA',
    });
    expect(result?.code).toBe('STATE:GA-CD:5');
    expect(result?.level).toBe('federal');
  });

  it('extracts district number from name when id is missing', () => {
    const result = mapDistrict({
      district: { name: 'State House District 40', scope: 'stateLower' },
      stateAbbr: 'GA',
    });
    expect(result?.code).toBe('STATE:GA-SLDL:40');
  });

  it('maps stateUpper to SLDU', () => {
    const result = mapDistrict({
      district: {
        name: 'State Senate District 36',
        scope: 'stateUpper',
        id: 'ocd-division/country:us/state:ga/sldu:36',
      },
      stateAbbr: 'GA',
    });
    expect(result?.code).toBe('STATE:GA-SLDU:36');
    expect(result?.level).toBe('state');
  });

  it('maps countywide to COUNTY code', () => {
    const result = mapDistrict({
      district: { name: 'Fulton County', scope: 'countywide' },
      ballotTitle: 'District Attorney',
      stateAbbr: 'GA',
    });
    expect(result?.code).toBe('COUNTY:GA-FULTON');
    expect(result?.level).toBe('county');
  });

  it('strips "County" suffix consistently', () => {
    const a = mapDistrict({
      district: { name: 'DeKalb County', scope: 'countywide' },
      stateAbbr: 'GA',
    });
    const b = mapDistrict({
      district: { name: 'DeKalb', scope: 'countywide' },
      stateAbbr: 'GA',
    });
    expect(a?.code).toBe(b?.code);
    expect(a?.code).toBe('COUNTY:GA-DEKALB');
  });

  it('maps cityWide to CITY code', () => {
    const result = mapDistrict({
      district: { name: 'City of Atlanta', scope: 'cityWide' },
      stateAbbr: 'GA',
    });
    expect(result?.code).toBe('CITY:GA-ATLANTA');
    expect(result?.level).toBe('city');
  });

  it('maps city council with numeric district', () => {
    const result = mapDistrict({
      district: {
        name: 'Atlanta City Council District 2',
        scope: 'cityCouncil',
      },
      ballotTitle: 'City Council Member',
      stateAbbr: 'GA',
    });
    expect(result?.code).toBe('CITY:GA-ATLANTA-COUNCIL:2');
    expect(result?.level).toBe('city');
  });

  it('maps county commission', () => {
    const result = mapDistrict({
      district: {
        name: 'Fulton County Commission District 4',
        scope: 'countyCouncil',
      },
      ballotTitle: 'County Commissioner',
      stateAbbr: 'GA',
    });
    expect(result?.code).toBe('COUNTY:GA-FULTON-COMMISSION:4');
    expect(result?.level).toBe('county');
  });

  it('maps judicial circuit', () => {
    const result = mapDistrict({
      district: {
        name: 'Atlanta Judicial Circuit',
        scope: 'judicial',
      },
      ballotTitle: 'Superior Court Judge',
      stateAbbr: 'GA',
    });
    expect(result?.code).toBe('JUDICIAL:GA-ATLANTA');
    expect(result?.level).toBe('state');
  });

  it('maps school board with numeric district', () => {
    const result = mapDistrict({
      district: {
        name: 'Fulton County Board of Education District 4',
        scope: 'schoolBoard',
      },
      ballotTitle: 'Board of Education',
      stateAbbr: 'GA',
    });
    expect(result?.code).toBe('SCHOOL:GA-FULTON-4');
  });

  it('returns null for unknown scopes', () => {
    const result = mapDistrict({
      district: { name: 'Some District', scope: 'special' as const },
      stateAbbr: 'GA',
    });
    expect(result).toBeNull();
  });

  it('returns null when congressional scope has no number', () => {
    const result = mapDistrict({
      district: { name: 'Some Congressional Thing', scope: 'congressional' },
      stateAbbr: 'GA',
    });
    expect(result).toBeNull();
  });

  it('strips trailing "District N" from office titles to avoid redundancy', () => {
    const result = mapDistrict({
      district: {
        name: 'State House District 60',
        scope: 'stateLower',
        id: 'ocd-division/country:us/state:ga/sldl:60',
      },
      ballotTitle: 'State Representative - District 60',
      stateAbbr: 'GA',
    });
    expect(result?.officeTitle).toBe('State Representative');
  });
});

describe('normalizeJurisdiction', () => {
  it('uppercases and strips County', () => {
    expect(normalizeJurisdiction('Fulton County')).toBe('FULTON');
  });

  it('strips City of prefix', () => {
    expect(normalizeJurisdiction('City of Atlanta')).toBe('ATLANTA');
  });

  it('converts spaces to hyphens', () => {
    expect(normalizeJurisdiction('Sandy Springs')).toBe('SANDY-SPRINGS');
  });

  it('strips punctuation', () => {
    expect(normalizeJurisdiction("St. Mary's County")).toBe('ST-MARYS');
  });
});
