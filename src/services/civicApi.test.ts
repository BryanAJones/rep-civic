import { resolveDistricts } from './civicApi';

describe('civicApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubEnv('VITE_CIVIC_API_KEY', 'test-key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns empty array when API key is not set', async () => {
    vi.stubEnv('VITE_CIVIC_API_KEY', '');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await resolveDistricts('123 Main St');
    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('VITE_CIVIC_API_KEY not set'),
    );
  });

  it('maps a Civic API response to District[]', async () => {
    const mockResponse = {
      offices: [
        {
          name: 'GA State Senate',
          divisionId: 'ocd-division/country:us/state:ga/sldu:40',
          levels: ['administrativeArea1'],
          officialIndices: [0],
        },
        {
          name: 'U.S. House',
          divisionId: 'ocd-division/country:us/state:ga/cd:5',
          levels: ['country'],
          officialIndices: [1],
        },
      ],
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const districts = await resolveDistricts('123 Atlanta Ave');

    expect(districts).toHaveLength(2);
    expect(districts[0]!.officeTitle).toBe('GA State Senate');
    expect(districts[0]!.level).toBe('state');
    expect(districts[0]!.code).toBe('STATE:GA-SLDU:40');
    expect(districts[1]!.level).toBe('federal');
  });

  it('returns empty array when offices is missing', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response);

    const result = await resolveDistricts('No Results Addr');
    expect(result).toEqual([]);
  });

  it('throws on non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
    } as Response);

    await expect(resolveDistricts('Bad address')).rejects.toThrow(
      'Civic API error: 400 Bad Request',
    );
  });

  it('correctly classifies city-level divisions', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          offices: [
            {
              name: 'City Council',
              divisionId: 'ocd-division/country:us/state:ga/place:atlanta/ward:1',
              officialIndices: [0],
            },
          ],
        }),
    } as Response);

    const districts = await resolveDistricts('Atlanta');
    expect(districts[0]!.level).toBe('city');
  });
});
