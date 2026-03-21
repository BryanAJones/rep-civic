import { useEffect, useState } from 'react';
import type { Video } from '../types/domain';
import { service } from '../services';

export function useVideoFeed(districtCodes: string[]) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      setLoading(true);
      setError(null);
      try {
        const result = await service.getFeedVideos(districtCodes);
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
  }, [districtCodes.join(',')]);

  return { videos, loading, error };
}
