import type { DataService } from './dataService';
import type {
  ActiveCandidate,
  Candidate,
  CandidateId,
  ChainId,
  DebateChain,
  District,
  DistrictCode,
  Question,
  QuestionId,
  Topic,
  UnclaimedCandidate,
  Video,
  VideoId,
} from '../types/domain';

// --- Mock Districts ---

const mockDistricts: District[] = [
  {
    code: 'ATL-SB-D6',
    level: 'city',
    officeTitle: 'Atlanta School Board',
    districtName: 'District 6',
    displayLabel: 'Atlanta School Board · District 6',
    candidateIds: ['c-ross', 'c-banks'],
  },
  {
    code: 'GA-SH-D40',
    level: 'state',
    officeTitle: 'GA State House',
    districtName: 'District 40',
    displayLabel: 'GA State House · District 40',
    candidateIds: ['c-johnson', 'c-mitchell'],
  },
  {
    code: 'GA-SEN-D40',
    level: 'state',
    officeTitle: 'GA State Senate',
    districtName: 'District 40',
    displayLabel: 'GA State Senate · District 40',
    candidateIds: ['c-reed', 'c-thompson'],
  },
  {
    code: 'GA-05',
    level: 'federal',
    officeTitle: 'US House',
    districtName: 'GA-05',
    displayLabel: 'US House · GA-05',
    candidateIds: ['c-williams'],
  },
  {
    code: 'GA-SEN-US-1',
    level: 'federal',
    officeTitle: 'US Senate',
    districtName: 'Georgia',
    displayLabel: 'US Senate · Georgia',
    candidateIds: ['c-warnock'],
  },
  {
    code: 'FULTON-CC-D2',
    level: 'county',
    officeTitle: 'Fulton County Commission',
    districtName: 'District 2',
    displayLabel: 'Fulton County Commission · District 2',
    candidateIds: ['c-hall'],
  },
];

// --- Mock Candidates ---

const mockCandidates: Record<CandidateId, Candidate> = {
  'c-ross': {
    id: 'c-ross',
    name: 'Sandra Ross',
    initials: 'SR',
    officeTitle: 'Atlanta School Board',
    districtCode: 'ATL-SB-D6',
    party: 'Non-partisan',
    status: 'active',
    videoCount: 8,
    answeredQuestionCount: 12,
    responseRate: 71,
    positions: [
      'Supports full-day pre-K expansion across all Title I schools.',
      'Opposes closing neighborhood schools for consolidation.',
      'Advocates for transparent quarterly budget reporting.',
    ],
  } as ActiveCandidate,
  'c-banks': {
    id: 'c-banks',
    name: 'Terrence Banks',
    initials: 'TB',
    officeTitle: 'Atlanta School Board',
    districtCode: 'ATL-SB-D6',
    party: 'Non-partisan',
    status: 'unclaimed',
    filingId: 'GA SOS #0044821',
    filingDate: '2026-01-15',
    campaignUrl: 'https://banksforschools.com',
    opponentCount: 1,
    questionCount: 47,
  } as UnclaimedCandidate,
  'c-johnson': {
    id: 'c-johnson',
    name: 'Marcus Johnson',
    initials: 'MJ',
    officeTitle: 'GA State House',
    districtCode: 'GA-SH-D40',
    party: 'Democrat',
    status: 'active',
    videoCount: 14,
    answeredQuestionCount: 23,
    responseRate: 82,
    positions: [
      'Co-sponsored the Georgia Small Business Tax Relief Act.',
      'Supports Medicaid expansion under the ACA.',
      'Advocates for criminal justice reform and bail reduction.',
    ],
  } as ActiveCandidate,
  'c-mitchell': {
    id: 'c-mitchell',
    name: 'Dana Mitchell',
    initials: 'DM',
    officeTitle: 'GA State House',
    districtCode: 'GA-SH-D40',
    party: 'Republican',
    status: 'claimed',
    videoCount: 0,
    questionCount: 19,
    positions: [
      'Supports school choice and charter school expansion.',
      'Opposes state income tax increases.',
    ],
  },
  'c-reed': {
    id: 'c-reed',
    name: 'Angela Reed',
    initials: 'AR',
    officeTitle: 'GA State Senate',
    districtCode: 'GA-SEN-D40',
    party: 'Democrat',
    status: 'active',
    videoCount: 6,
    answeredQuestionCount: 9,
    responseRate: 64,
    positions: [
      'Authored SB 204 on small business taxation.',
      'Supports affordable housing investment in metro Atlanta.',
    ],
  } as ActiveCandidate,
  'c-thompson': {
    id: 'c-thompson',
    name: 'Brian Thompson',
    initials: 'BT',
    officeTitle: 'GA State Senate',
    districtCode: 'GA-SEN-D40',
    party: 'Republican',
    status: 'unclaimed',
    filingId: 'GA SOS #0051203',
    filingDate: '2026-02-03',
    opponentCount: 1,
    questionCount: 31,
  } as UnclaimedCandidate,
  'c-williams': {
    id: 'c-williams',
    name: 'Keisha Williams',
    initials: 'KW',
    officeTitle: 'US House',
    districtCode: 'GA-05',
    party: 'Democrat',
    status: 'active',
    videoCount: 22,
    answeredQuestionCount: 35,
    responseRate: 88,
    positions: [
      'Supports the John Lewis Voting Rights Advancement Act.',
      'Advocates for federal infrastructure investment in transit.',
    ],
  } as ActiveCandidate,
  'c-warnock': {
    id: 'c-warnock',
    name: 'Raphael Warnock',
    initials: 'RW',
    officeTitle: 'US Senate',
    districtCode: 'GA-SEN-US-1',
    party: 'Democrat',
    status: 'active',
    videoCount: 31,
    answeredQuestionCount: 44,
    responseRate: 76,
    positions: [
      'Supports capping insulin costs at $35.',
      'Advocates for student loan relief.',
    ],
  } as ActiveCandidate,
  'c-hall': {
    id: 'c-hall',
    name: 'Patricia Hall',
    initials: 'PH',
    officeTitle: 'Fulton County Commission',
    districtCode: 'FULTON-CC-D2',
    party: 'Democrat',
    status: 'active',
    videoCount: 5,
    answeredQuestionCount: 7,
    responseRate: 58,
    positions: [
      'Supports expanding MARTA bus routes in south Fulton.',
      'Advocates for county-funded affordable housing trust.',
    ],
  } as ActiveCandidate,
};

// --- Mock Videos ---

const mockVideos: Video[] = [
  {
    id: 'v-001',
    candidateId: 'c-ross',
    postType: 'statement',
    caption: 'Every parent deserves to know where the budget goes.',
    thumbnailUrl: '',
    videoUrl: '',
    reactionCount: 142,
    questionCount: 23,
    publishedAt: '2026-03-18T14:30:00Z',
  },
  {
    id: 'v-002',
    candidateId: 'c-johnson',
    postType: 'statement',
    caption: 'SB 204 would cut taxes for 12,000 small businesses in our district.',
    thumbnailUrl: '',
    videoUrl: '',
    reactionCount: 89,
    questionCount: 15,
    publishedAt: '2026-03-17T10:00:00Z',
  },
  {
    id: 'v-003',
    candidateId: 'c-reed',
    postType: 'response-to-opponent',
    caption: 'My opponent claims SB 204 raises costs. Here are the actual numbers.',
    thumbnailUrl: '',
    videoUrl: '',
    reactionCount: 214,
    questionCount: 31,
    publishedAt: '2026-03-17T16:45:00Z',
    chainId: 'chain-001',
    chainDepth: 1,
  },
  {
    id: 'v-004',
    candidateId: 'c-ross',
    postType: 'qa-reply',
    caption: 'Great question about pre-K enrollment caps.',
    thumbnailUrl: '',
    videoUrl: '',
    reactionCount: 67,
    questionCount: 8,
    publishedAt: '2026-03-16T09:15:00Z',
    answersQuestionId: 'q-005',
  },
  {
    id: 'v-005',
    candidateId: 'c-williams',
    postType: 'statement',
    caption: 'The infrastructure bill means 4 new MARTA stations for GA-05.',
    thumbnailUrl: '',
    videoUrl: '',
    reactionCount: 301,
    questionCount: 42,
    publishedAt: '2026-03-19T12:00:00Z',
  },
  {
    id: 'v-006',
    candidateId: 'c-hall',
    postType: 'statement',
    caption: 'South Fulton deserves the same transit access as Buckhead.',
    thumbnailUrl: '',
    videoUrl: '',
    reactionCount: 95,
    questionCount: 18,
    publishedAt: '2026-03-15T08:30:00Z',
  },
];

// --- Mock Questions ---

const mockQuestions: Question[] = [
  {
    id: 'q-001',
    videoId: 'v-001',
    candidateId: 'c-ross',
    text: 'What specific line items would you cut from the current budget?',
    authorHandle: '@maria_d6',
    plusOneCount: 47,
    state: 'answered',
    answerVideoId: 'v-004',
    createdAt: '2026-03-18T15:00:00Z',
  },
  {
    id: 'q-002',
    videoId: 'v-001',
    candidateId: 'c-ross',
    text: 'How will you ensure budget transparency reaches non-English speaking families?',
    authorHandle: '@carlos_atl',
    plusOneCount: 31,
    state: 'default',
    createdAt: '2026-03-18T15:30:00Z',
  },
  {
    id: 'q-003',
    videoId: 'v-001',
    candidateId: 'c-ross',
    text: 'Will you support independent audits of school construction spending?',
    authorHandle: '@jenny_westend',
    plusOneCount: 28,
    state: 'voted',
    createdAt: '2026-03-18T16:00:00Z',
  },
  {
    id: 'q-004',
    videoId: 'v-002',
    candidateId: 'c-johnson',
    text: 'Does SB 204 include protections for gig workers or just traditional businesses?',
    authorHandle: '@dre_40',
    plusOneCount: 19,
    state: 'default',
    createdAt: '2026-03-17T11:00:00Z',
  },
  {
    id: 'q-005',
    videoId: 'v-001',
    candidateId: 'c-ross',
    text: 'Are there plans to expand pre-K enrollment caps next year?',
    authorHandle: '@tasha_parent',
    plusOneCount: 52,
    state: 'answered',
    answerVideoId: 'v-004',
    createdAt: '2026-03-18T14:45:00Z',
  },
  {
    id: 'q-006',
    videoId: 'v-005',
    candidateId: 'c-williams',
    text: 'Which neighborhoods are getting the new MARTA stations?',
    authorHandle: '@transit_rider',
    plusOneCount: 88,
    state: 'default',
    createdAt: '2026-03-19T13:00:00Z',
  },
  // Profile-level questions for unclaimed candidate
  {
    id: 'q-100',
    candidateId: 'c-banks',
    text: 'What is your position on the proposed school consolidation plan?',
    authorHandle: '@concerned_parent',
    plusOneCount: 34,
    state: 'default',
    createdAt: '2026-03-10T09:00:00Z',
  },
  {
    id: 'q-101',
    candidateId: 'c-banks',
    topicId: 'topic-001',
    text: 'How would you address the 12% enrollment decline at Therrell?',
    authorHandle: '@sw_atl_mom',
    plusOneCount: 22,
    state: 'default',
    createdAt: '2026-03-11T14:00:00Z',
  },
];

// --- Mock Topics ---

const mockTopics: Topic[] = [
  {
    id: 'topic-001',
    candidateId: 'c-banks',
    title: 'APS Enrollment Decline in Southwest Atlanta',
    sourceBadge: 'APS enrollment data',
    questions: mockQuestions.filter((q) => q.topicId === 'topic-001'),
  },
  {
    id: 'topic-002',
    candidateId: 'c-banks',
    title: 'School Board Budget Hearing — March 2026',
    sourceBadge: 'APS board agenda',
    questions: [],
  },
];

// --- Mock Debate Chain ---

const mockChains: Record<ChainId, DebateChain> = {
  'chain-001': {
    id: 'chain-001',
    districtCode: 'GA-SEN-D40',
    topicLabel: 'SB 204 · Small Business Taxation',
    openedAt: '2026-03-17T16:45:00Z',
    nodes: [
      { videoId: 'v-002', candidateId: 'c-johnson', depth: 0 },
      { videoId: 'v-003', candidateId: 'c-reed', parentVideoId: 'v-002', depth: 1 },
    ],
    participants: [
      { candidateId: 'c-johnson', responsesUsed: 0, responsesAllowed: 2 },
      { candidateId: 'c-reed', responsesUsed: 1, responsesAllowed: 2 },
    ],
    totalQuestions: 46,
  },
};

// --- Mock DataService Implementation ---

function delay<T>(value: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const mockService: DataService = {
  resolveDistricts(_address: string) {
    return delay(mockDistricts);
  },

  getFeedVideos(_districtCodes: DistrictCode[]) {
    const sorted = [...mockVideos].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
    return delay(sorted);
  },

  getQuestionsForVideo(videoId: VideoId) {
    const filtered = mockQuestions
      .filter((q) => q.videoId === videoId)
      .sort((a, b) => b.plusOneCount - a.plusOneCount);
    return delay(filtered);
  },

  getQuestionsForCandidate(candidateId: CandidateId) {
    const filtered = mockQuestions
      .filter((q) => q.candidateId === candidateId)
      .sort((a, b) => b.plusOneCount - a.plusOneCount);
    return delay(filtered);
  },

  submitQuestion(candidateId, videoId, text) {
    const question: Question = {
      id: `q-${Date.now()}`,
      videoId: videoId ?? undefined,
      candidateId,
      text,
      authorHandle: '@you',
      plusOneCount: 1,
      state: 'voted',
      createdAt: new Date().toISOString(),
    };
    mockQuestions.push(question);
    return delay(question);
  },

  voteQuestion(questionId: QuestionId) {
    const q = mockQuestions.find((q) => q.id === questionId);
    if (q) {
      q.plusOneCount += 1;
      q.state = 'voted';
      return delay({ newCount: q.plusOneCount });
    }
    return Promise.reject(new Error('Question not found'));
  },

  getCandidate(candidateId: CandidateId) {
    const c = mockCandidates[candidateId];
    if (c) return delay(c);
    return Promise.reject(new Error('Candidate not found'));
  },

  getCandidatesForDistrict(districtCode: DistrictCode) {
    const candidates = Object.values(mockCandidates).filter(
      (c) => c.districtCode === districtCode,
    );
    return delay(candidates);
  },

  getTopicsForCandidate(candidateId: CandidateId) {
    const filtered = mockTopics.filter((t) => t.candidateId === candidateId);
    return delay(filtered);
  },

  getDebateChain(chainId: ChainId) {
    const chain = mockChains[chainId];
    if (chain) return delay(chain);
    return Promise.reject(new Error('Chain not found'));
  },

  getVideo(videoId: VideoId) {
    const v = mockVideos.find((v) => v.id === videoId);
    if (v) return delay(v);
    return Promise.reject(new Error('Video not found'));
  },

  getVideosForCandidate(candidateId: CandidateId) {
    const filtered = mockVideos.filter((v) => v.candidateId === candidateId);
    return delay(filtered);
  },
};
