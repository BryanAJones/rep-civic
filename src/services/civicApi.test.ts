import { mapGeocodioResponse } from './civicApi';

describe('civicApi — mapGeocodioResponse', () => {
  it('maps a full Geocodio response to District[]', () => {
    const response = {
      results: [
        {
          fields: {
            congressional_districts: [
              {
                name: 'Congressional District 5',
                district_number: 5,
                ocd_id: 'ocd-division/country:us/state:ga/cd:5',
              },
            ],
            state_legislative_districts: {
              senate: [
                {
                  name: 'State Senate District 40',
                  district_number: 40,
                  ocd_id: 'ocd-division/country:us/state:ga/sldu:40',
                },
              ],
              house: [
                {
                  name: 'State House District 60',
                  district_number: 60,
                  ocd_id: 'ocd-division/country:us/state:ga/sldl:60',
                },
              ],
            },
          },
        },
      ],
    };

    const districts = mapGeocodioResponse(response);

    // CD + Senate + House + U.S. Senate at-large = 4
    expect(districts).toHaveLength(4);

    // Congressional district
    expect(districts[0]!.code).toBe('STATE:GA-CD:5');
    expect(districts[0]!.level).toBe('federal');
    expect(districts[0]!.officeTitle).toBe('U.S. Representative, District 5');

    // State Senate
    expect(districts[1]!.code).toBe('STATE:GA-SLDU:40');
    expect(districts[1]!.level).toBe('state');

    // State House
    expect(districts[2]!.code).toBe('STATE:GA-SLDL:60');
    expect(districts[2]!.level).toBe('state');

    // U.S. Senate (auto-added)
    expect(districts[3]!.code).toBe('STATE:GA');
    expect(districts[3]!.level).toBe('federal');
    expect(districts[3]!.officeTitle).toBe('U.S. Senator');
  });

  it('returns empty array when results is empty', () => {
    expect(mapGeocodioResponse({ results: [] })).toEqual([]);
  });

  it('returns empty array when fields is missing', () => {
    expect(mapGeocodioResponse({ results: [{}] })).toEqual([]);
  });

  it('returns empty array when results is undefined', () => {
    expect(mapGeocodioResponse({})).toEqual([]);
  });

  it('does not add U.S. Senate when no districts found', () => {
    expect(mapGeocodioResponse({ results: [{ fields: {} }] })).toEqual([]);
  });

  it('handles response with only congressional districts', () => {
    const response = {
      results: [
        {
          fields: {
            congressional_districts: [
              {
                name: 'Congressional District 13',
                district_number: 13,
                ocd_id: 'ocd-division/country:us/state:ga/cd:13',
              },
            ],
          },
        },
      ],
    };

    const districts = mapGeocodioResponse(response);
    // CD + U.S. Senate at-large = 2
    expect(districts).toHaveLength(2);
    expect(districts[0]!.code).toBe('STATE:GA-CD:13');
    expect(districts[1]!.code).toBe('STATE:GA');
  });
});
