import { useEffect, useState } from 'react';
import type { Candidate, District, DistrictLevel } from '../types/domain';
import { service } from '../services';

export interface BallotGroup {
  level: DistrictLevel;
  label: string;
  candidates: Candidate[];
}

/** Level display order: federal first, then state, county, city. */
const LEVEL_ORDER: DistrictLevel[] = ['federal', 'state', 'county', 'city'];

const LEVEL_LABELS: Record<DistrictLevel, string> = {
  federal: 'FEDERAL',
  state: 'STATE LEGISLATURE',
  county: 'COUNTY',
  city: 'CITY',
};

export function useMyBallot(districts: District[]) {
  const [groups, setGroups] = useState<BallotGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const codes = districts.map((d) => d.code);
  const cacheKey = codes.join(',');

  useEffect(() => {
    if (codes.length === 0) {
      setGroups([]);
      return;
    }

    let cancelled = false;

    async function fetch() {
      setLoading(true);
      setError(null);
      try {
        const candidates = await service.getCandidatesByDistricts(codes);
        if (cancelled) return;

        // Build a code→level lookup from the districts array
        const levelByCode = new Map(districts.map((d) => [d.code, d.level]));

        // Group candidates by district level
        const byLevel = new Map<DistrictLevel, Candidate[]>();
        for (const c of candidates) {
          const level = levelByCode.get(c.districtCode);
          if (!level) continue;
          const list = byLevel.get(level) ?? [];
          list.push(c);
          byLevel.set(level, list);
        }

        // Build ordered groups, skip empty levels
        const result: BallotGroup[] = [];
        for (const level of LEVEL_ORDER) {
          const list = byLevel.get(level);
          if (list && list.length > 0) {
            // Sort alphabetically within each group
            list.sort((a, b) => a.name.localeCompare(b.name));
            result.push({ level, label: LEVEL_LABELS[level], candidates: list });
          }
        }

        setGroups(result);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load ballot');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetch();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  const totalCandidates = groups.reduce((sum, g) => sum + g.candidates.length, 0);

  return { groups, totalCandidates, loading, error };
}
