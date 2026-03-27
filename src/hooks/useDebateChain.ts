import { useEffect, useState } from 'react';
import type { Candidate, ChainId, DebateChain, Video } from '../types/domain';
import { service } from '../services';

export function useDebateChain(chainId: ChainId | undefined) {
  const [chain, setChain] = useState<DebateChain | null>(null);
  const [videos, setVideos] = useState<Record<string, Video>>({});
  const [candidates, setCandidates] = useState<Record<string, Candidate>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chainId) return;

    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const c = await service.getDebateChain(chainId!);
        if (cancelled) return;

        // Fetch all videos and candidates referenced by the chain nodes
        const videoIds = [...new Set(c.nodes.map((n) => n.videoId))];
        const candidateIds = [...new Set(c.nodes.map((n) => n.candidateId))];

        const [fetchedVideos, fetchedCandidates] = await Promise.all([
          Promise.all(videoIds.map((id) => service.getVideo(id))),
          Promise.all(candidateIds.map((id) => service.getCandidate(id))),
        ]);

        if (cancelled) return;

        const videoMap: Record<string, Video> = {};
        for (const v of fetchedVideos) {
          videoMap[v.id] = v;
        }

        const candidateMap: Record<string, Candidate> = {};
        for (const cd of fetchedCandidates) {
          candidateMap[cd.id] = cd;
        }

        setChain(c);
        setVideos(videoMap);
        setCandidates(candidateMap);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load chain');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [chainId]);

  return { chain, videos, candidates, loading, error };
}
