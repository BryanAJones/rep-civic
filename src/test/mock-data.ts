import type { Candidate, Question, Video, District, UnclaimedCandidate } from '../types/domain';

export function buildQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'q-test-1',
    candidateId: 'c-test',
    text: 'Test question text',
    authorHandle: '@testuser',
    plusOneCount: 5,
    state: 'default',
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

export function buildVideo(overrides: Partial<Video> = {}): Video {
  return {
    id: 'v-test-1',
    candidateId: 'c-test',
    postType: 'statement',
    caption: 'Test video caption',
    thumbnailUrl: '',
    videoUrl: '',
    reactionCount: 10,
    questionCount: 3,
    publishedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

export function buildCandidate(overrides: Partial<UnclaimedCandidate> = {}): Candidate {
  return {
    id: 'c-test-1',
    name: 'Test Candidate',
    initials: 'TC',
    officeTitle: 'Test Office',
    districtCode: 'TEST-D1',
    party: 'Independent',
    status: 'unclaimed',
    filingId: 'TEST-001',
    filingDate: '2026-01-01',
    opponentCount: 0,
    questionCount: 0,
    ...overrides,
  };
}

export function buildDistrict(overrides: Partial<District> = {}): District {
  return {
    code: 'TEST-D1',
    level: 'state',
    officeTitle: 'Test Office',
    districtName: 'District 1',
    displayLabel: 'Test Office - District 1',
    candidateIds: [],
    ...overrides,
  };
}
