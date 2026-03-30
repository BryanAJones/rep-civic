import { resolveDistricts } from './civicApi';

describe('civicApi (Geocodio)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubEnv('VITE_GEOCODIO_API_KEY', 'test-key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns empty array when API key is not set', async () => {
    vi.stubEnv('VITE_GEOCODIO_API_KEY', '');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await resolveDistricts('123 Main St');
    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('VITE_GEOCODIO_API_KEY not set'),
    );
  });

  it('maps a Geocodio response to District[]', async () => {
    const mockResponse = {
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

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const districts = await resolveDistricts('123 Atlanta Ave');

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

  it('returns empty array when results is empty', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results: [] }),
    } as Response);

    const result = await resolveDistricts('No Results Addr');
    expect(result).toEqual([]);
  });

  it('returns empty array when fields is missing', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results: [{}] }),
    } as Response);

    const result = await resolveDistricts('Missing Fields Addr');
    expect(result).toEqual([]);
  });

  it('throws on non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    } as Response);

    await expect(resolveDistricts('Bad address')).rejects.toThrow(
      'Geocodio API error: 403 Forbidden',
    );
  });

  it('does not add U.S. Senate when no districts found', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          results: [{ fields: {} }],
        }),
    } as Response);

    const districts = await resolveDistricts('Empty');
    expect(districts).toEqual([]);
  });
});
