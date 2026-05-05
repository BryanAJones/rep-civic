import { useCallback, useEffect, useState } from 'react';
import type { CandidateId, Question, VideoId } from '../types/domain';
import { service } from '../services';
import { useEmailGate } from '../components/auth';
import { EmailRequiredError } from '../utils/errors';

export function useQuestions(videoId: VideoId | null, candidateId: CandidateId | null = null) {
  const { requireEmail } = useEmailGate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoId) {
      setQuestions([]);
      return;
    }

    let cancelled = false;

    async function fetch() {
      setLoading(true);
      setError(null);
      try {
        const result = await service.getQuestionsForVideo(videoId!);
        if (!cancelled) setQuestions(result);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load questions');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [videoId]);

  const submitQuestion = useCallback(async (text: string) => {
    if (!candidateId) return;
    try {
      setError(null);
      const q = await service.submitQuestion(candidateId, videoId, text);
      setQuestions((prev) => [...prev, q].sort((a, b) => b.plusOneCount - a.plusOneCount));
    } catch (e) {
      if (e instanceof EmailRequiredError) {
        requireEmail({
          intent: { type: 'submit-question', candidateId, videoId, topicId: null, text },
          message: e.message,
        });
        return;
      }
      setError(e instanceof Error ? e.message : 'Failed to submit question');
    }
  }, [videoId, candidateId, requireEmail]);

  return { questions, setQuestions, loading, error, submitQuestion };
}
