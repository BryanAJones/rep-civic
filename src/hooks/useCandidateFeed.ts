import { useEffect, useState } from 'react';
import type { Candidate, DistrictCode } from '../types/domain';
import { service } from '../services';

export function useCandidateFeed(districtCodes: DistrictCode[]) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (districtCodes.length === 0) {
      setCandidates([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetch() {
      setLoading(true);
      setError(null);
      try {
        const results = await service.getCandidatesByDistricts(districtCodes);
        if (cancelled) return;

        // Deduplicate by candidate ID
        const seen = new Set<string>();
        const unique: Candidate[] = [];
        for (const c of results) {
          if (!seen.has(c.id)) {
            seen.add(c.id);
            unique.push(c);
          }
        }

        // Sort: candidates with more questions first, then alphabetically
        const qCount = (c: Candidate): number =>
          c.status === 'active' ? c.answeredQuestionCount : c.questionCount;
        unique.sort((a, b) => qCount(b) - qCount(a) || a.name.localeCompare(b.name));
        setCandidates(unique);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load candidates');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [districtCodes.join(',')]);

  return { candidates, loading, error };
}
