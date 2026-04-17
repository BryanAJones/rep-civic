import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the supabase client module before importing the service.
const { invokeMock } = vi.hoisted(() => ({ invokeMock: vi.fn() }));
vi.mock('./supabaseClient', () => ({
  supabase: {
    functions: { invoke: invokeMock },
    from: vi.fn(),
    auth: { getSession: vi.fn() },
  },
}));

import { supabaseService } from './supabaseService';

describe('supabaseService.getBallotForAddress', () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it('passes through the google payload unchanged', async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
        source: 'google',
        districts: [
          {
            code: 'STATE:GA-CD:5',
            level: 'federal',
            officeTitle: 'U.S. Representative',
            districtName: "Georgia's 5th",
            displayLabel: 'U.S. Representative · STATE:GA-CD:5',
            candidateIds: [],
          },
        ],
        electionName: 'Georgia Primary',
        electionDate: '2026-05-19',
      },
      error: null,
    });

    const result = await supabaseService.getBallotForAddress('100 Auburn Ave NE, Atlanta, GA 30303');
    expect(result.source).toBe('google');
    expect(result.electionName).toBe('Georgia Primary');
    expect(result.electionDate).toBe('2026-05-19');
    expect(result.districts).toHaveLength(1);
    expect(result.districts[0]?.code).toBe('STATE:GA-CD:5');
    expect(invokeMock).toHaveBeenCalledWith('proxy-voterinfo', {
      body: { address: '100 Auburn Ave NE, Atlanta, GA 30303' },
    });
  });

  it('delegates to resolveDistricts when Google returns fallback', async () => {
    // First call: proxy-voterinfo responds fallback.
    invokeMock.mockResolvedValueOnce({
      data: { source: 'fallback', districts: [], candidateIds: [] },
      error: null,
    });
    // Second call: proxy-geocodio returns a geocodio-shaped payload,
    // which mapGeocodioResponse converts to districts.
    invokeMock.mockResolvedValueOnce({
      data: {
        results: [
          {
            fields: {
              congressional_districts: [
                {
                  name: "Congressional District 5",
                  district_number: 5,
                  ocd_id: 'ocd-division/country:us/state:ga/cd:5',
                },
              ],
            },
          },
        ],
      },
      error: null,
    });

    const result = await supabaseService.getBallotForAddress('1600 Fernwood Cir NE, Atlanta, GA 30319');
    expect(result.source).toBe('fallback');
    expect(result.electionName).toBeUndefined();
    expect(result.districts.length).toBeGreaterThan(0);
    expect(invokeMock).toHaveBeenCalledTimes(2);
    expect(invokeMock.mock.calls[0]?.[0]).toBe('proxy-voterinfo');
    expect(invokeMock.mock.calls[1]?.[0]).toBe('proxy-geocodio');
  });

  it('throws when the Edge Function invocation errors', async () => {
    invokeMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'Edge Function unavailable' },
    });
    await expect(
      supabaseService.getBallotForAddress('invalid'),
    ).rejects.toMatchObject({ message: 'Edge Function unavailable' });
  });
});
