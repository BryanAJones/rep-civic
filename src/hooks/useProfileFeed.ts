import { useEffect, useState } from 'react';
import type { Candidate, CandidateId, DistrictCode, Question } from '../types/domain';
import { service } from '../services';

export interface ProfileFeedEntry {
  candidate: Candidate;
  topQuestions: Question[];
}

const TOP_QUESTIONS_PER_CARD = 2;

/**
 * Combined feed source for the profile-first experience: candidates in a set
 * of districts, each pre-loaded with their top questions for inline +1 voting.
 * Single round-trip per render so cards never wait for individual fetches.
 */
export function useProfileFeed(districtCodes: DistrictCode[]) {
  const [entries, setEntries] = useState<ProfileFeedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (districtCodes.length === 0) {
      setEntries([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetch() {
      setLoading(true);
      setError(null);
      try {
        const candidates = await service.getCandidatesByDistricts(districtCodes);
        if (cancelled) return;

        const seen = new Set<string>();
        const unique: Candidate[] = [];
        for (const c of candidates) {
          if (!seen.has(c.id)) {
            seen.add(c.id);
            unique.push(c);
          }
        }
        const qCount = (c: Candidate): number =>
          c.status === 'active' ? c.answeredQuestionCount : c.questionCount;
        unique.sort((a, b) => qCount(b) - qCount(a) || a.name.localeCompare(b.name));

        const ids = unique.map((c) => c.id);
        const questionsMap = await service.getTopQuestionsForCandidates(ids, TOP_QUESTIONS_PER_CARD);
        if (cancelled) return;

        setEntries(unique.map((c) => ({
          candidate: c,
          topQuestions: questionsMap.get(c.id) ?? [],
        })));
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

  const updateQuestion = (candidateId: CandidateId, updater: (qs: Question[]) => Question[]) => {
    setEntries((prev) => prev.map((e) =>
      e.candidate.id === candidateId
        ? { ...e, topQuestions: updater(e.topQuestions) }
        : e,
    ));
  };

  const addQuestion = (candidateId: CandidateId, q: Question) => {
    updateQuestion(candidateId, (qs) =>
      [...qs, q].sort((a, b) => b.plusOneCount - a.plusOneCount).slice(0, TOP_QUESTIONS_PER_CARD));
  };

  return { entries, loading, error, updateQuestion, addQuestion };
}
