import type { Question, Video, District } from '../types/domain';

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
