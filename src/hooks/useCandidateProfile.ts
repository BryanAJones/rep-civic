import { useEffect, useState } from 'react';
import type { Candidate, CandidateId, Question, Topic, Video } from '../types/domain';
import { service } from '../services';

export function useCandidateProfile(candidateId: CandidateId | undefined) {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!candidateId) return;

    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [c, v, q, t] = await Promise.all([
          service.getCandidate(candidateId!),
          service.getVideosForCandidate(candidateId!),
          service.getQuestionsForCandidate(candidateId!),
          service.getTopicsForCandidate(candidateId!),
        ]);
        if (cancelled) return;
        setCandidate(c);
        setVideos(v);
        setQuestions(q);
        setTopics(t);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load profile');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [candidateId]);

  return { candidate, videos, questions, topics, loading, error };
}
