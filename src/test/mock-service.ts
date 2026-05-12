import type { DataService } from '../services/dataService';

export function createMockService(
  overrides: Partial<DataService> = {},
): DataService {
  return {
    resolveDistricts: vi.fn().mockResolvedValue([]),
    getBallotForAddress: vi
      .fn()
      .mockResolvedValue({ source: 'fallback', districts: [] }),
    getFeedVideos: vi.fn().mockResolvedValue([]),
    getQuestionsForVideo: vi.fn().mockResolvedValue([]),
    getQuestionsForCandidate: vi.fn().mockResolvedValue([]),
    getTopQuestionsForCandidates: vi.fn().mockResolvedValue(new Map()),
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
    getCandidatesByDistricts: vi.fn().mockResolvedValue([]),
    getTopicsForCandidate: vi.fn().mockResolvedValue([]),
    getDebateChain: vi.fn().mockRejectedValue(new Error('Not found')),
    getVideo: vi.fn().mockRejectedValue(new Error('Not found')),
    getVideosForCandidate: vi.fn().mockResolvedValue([]),
    submitFeedback: vi.fn().mockResolvedValue({ id: 'fb-test' }),
    getMyClaim: vi.fn().mockResolvedValue(null),
    verifyCandidateClaim: vi
      .fn()
      .mockResolvedValue({ status: 'email_sent', emailHint: 'tre***@example.com' }),
    submitSocialProof: vi
      .fn()
      .mockResolvedValue({
        status: 'social_proof_submitted',
        pendingClaimId: '00000000-0000-0000-0000-000000000001',
      }),
    finalizeCandidateClaim: vi.fn().mockResolvedValue(null),
    revokeCandidateClaim: vi.fn().mockResolvedValue(undefined),
    getDashboardInbox: vi.fn().mockResolvedValue([]),
    submitVideoAnswer: vi.fn().mockRejectedValue(new Error('not configured')),
    ...overrides,
  };
}
