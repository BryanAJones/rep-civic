import type { DataService } from '../services/dataService';

export function createMockService(
  overrides: Partial<DataService> = {},
): DataService {
  return {
    resolveDistricts: vi.fn().mockResolvedValue([]),
    getFeedVideos: vi.fn().mockResolvedValue([]),
    getQuestionsForVideo: vi.fn().mockResolvedValue([]),
    getQuestionsForCandidate: vi.fn().mockResolvedValue([]),
    submitQuestion: vi
      .fn()
      .mockResolvedValue({
        id: 'q-new',
        candidateId: 'c-test',
        text: 'New question',
        authorHandle: '@test',
        plusOneCount: 0,
        state: 'default',
        createdAt: new Date().toISOString(),
      }),
    voteQuestion: vi.fn().mockResolvedValue({ newCount: 1 }),
    getCandidate: vi.fn().mockRejectedValue(new Error('Not found')),
    getCandidatesForDistrict: vi.fn().mockResolvedValue([]),
    getTopicsForCandidate: vi.fn().mockResolvedValue([]),
    getDebateChain: vi.fn().mockRejectedValue(new Error('Not found')),
    getVideo: vi.fn().mockRejectedValue(new Error('Not found')),
    getVideosForCandidate: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}
