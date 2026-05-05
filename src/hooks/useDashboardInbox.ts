import { useCallback, useEffect, useState } from 'react';
import type { CandidateId, Question, QuestionId, Video } from '../types/domain';
import { service } from '../services';

export function useDashboardInbox(candidateId: CandidateId | null) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!candidateId) {
      setQuestions([]);
      return;
    }

    let cancelled = false;

    async function fetch() {
      setLoading(true);
      setError(null);
      try {
        const result = await service.getDashboardInbox(candidateId!);
        if (!cancelled) setQuestions(result);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load inbox');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [candidateId]);

  const submitAnswer = useCallback(async (
    questionId: QuestionId,
    file: File,
    caption?: string,
  ): Promise<Video> => {
    if (!candidateId) throw new Error('No claimed candidate');
    const video = await service.submitVideoAnswer({ candidateId, questionId, file, caption });
    setQuestions((prev) => prev.map((q) => q.id === questionId
      ? { ...q, state: 'answered', answerVideoId: video.id }
      : q));
    return video;
  }, [candidateId]);

  return { questions, loading, error, submitAnswer };
}
