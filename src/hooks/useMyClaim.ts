import { useEffect, useState } from 'react';
import type { Candidate } from '../types/domain';
import { service } from '../services';

/**
 * Returns the candidate the current user has claimed, or null if none.
 * `loading` distinguishes "still resolving" from "definitely no claim" so
 * the dashboard route gate doesn't bounce mid-resolution.
 */
export function useMyClaim() {
  const [claim, setClaim] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      setLoading(true);
      setError(null);
      try {
        const result = await service.getMyClaim();
        if (!cancelled) setClaim(result);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load claim');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, []);

  return { claim, loading, error };
}
