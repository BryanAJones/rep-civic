import { useEffect, useState } from 'react';
import type { DistrictLevel, Video } from '../types/domain';
import { service } from '../services';

export function useVideoFeed(districtCodes: string[], level?: DistrictLevel | null) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // null means "All" — pass undefined to service so it skips level filtering
  const filterLevel = level ?? undefined;

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      setLoading(true);
      setError(null);
      try {
        const result = await service.getFeedVideos(districtCodes, filterLevel);
        if (!cancelled) {
          setVideos(result);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load feed');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [districtCodes.join(','), filterLevel]);

  return { videos, loading, error };
}
