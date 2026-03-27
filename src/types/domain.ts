// Core identifiers
export type DistrictCode = string;
export type FilingId = string;
export type UserId = string;
export type CandidateId = string;
export type VideoId = string;
export type QuestionId = string;
export type ChainId = string;

// District levels — EXTENSIBILITY: add new district levels here
export type DistrictLevel = 'city' | 'county' | 'state' | 'federal';

export interface District {
  code: DistrictCode;
  level: DistrictLevel;
  officeTitle: string;
  districtName: string;
  displayLabel: string;
  candidateIds: CandidateId[];
}

export interface UserProfile {
  id: UserId;
  handle: string;
  /** @deprecated Onboarding input only. Must not persist to server-side user record or client storage. */
  registeredAddress: string;
  districts: District[];
  votedQuestionIds: QuestionId[];
}

// Candidate — discriminated union on status
export type CandidateStatus = 'unclaimed' | 'claimed' | 'active';

interface CandidateBase {
  id: CandidateId;
  name: string;
  initials: string;
  officeTitle: string;
  districtCode: DistrictCode;
  party: string;
  status: CandidateStatus;
}

export interface UnclaimedCandidate extends CandidateBase {
  status: 'unclaimed';
  filingId: FilingId;
  filingDate: string;
  campaignUrl?: string;
  opponentCount: number;
  questionCount: number;
}

export interface ClaimedCandidate extends CandidateBase {
  status: 'claimed';
  videoCount: 0;
  questionCount: number;
  positions: string[];
}

export interface ActiveCandidate extends CandidateBase {
  status: 'active';
  videoCount: number;
  answeredQuestionCount: number;
  responseRate: number;
  positions: string[];
}

export type Candidate = UnclaimedCandidate | ClaimedCandidate | ActiveCandidate;

// Video post types — EXTENSIBILITY: add new post types here
export type VideoPostType = 'statement' | 'response-to-opponent' | 'qa-reply';

export interface Video {
  id: VideoId;
  candidateId: CandidateId;
  postType: VideoPostType;
  caption: string;
  thumbnailUrl: string;
  videoUrl: string;
  reactionCount: number;
  questionCount: number;
  publishedAt: string;
  answersQuestionId?: QuestionId;
  chainId?: ChainId;
  chainDepth?: number;
}

// Questions
export type QuestionState = 'default' | 'voted' | 'answered';

export interface Question {
  id: QuestionId;
  videoId?: VideoId;
  topicId?: string;
  candidateId: CandidateId;
  text: string;
  /** SECURITY: Must be server-derived from the authenticated session. Never accept from client. */
  authorHandle: string;
  plusOneCount: number;
  state: QuestionState;
  answerVideoId?: VideoId;
  createdAt: string;
}

// Auto-generated topic cards (unclaimed profiles)
export interface Topic {
  id: string;
  candidateId: CandidateId;
  title: string;
  sourceBadge: string;
  questions: Question[];
}

// Debate chains
export interface ChainParticipant {
  candidateId: CandidateId;
  responsesUsed: number;
  responsesAllowed: 2;
}

export interface ChainNode {
  videoId: VideoId;
  candidateId: CandidateId;
  parentVideoId?: VideoId;
  depth: number;
}

export interface DebateChain {
  id: ChainId;
  districtCode: DistrictCode;
  topicLabel: string;
  openedAt: string;
  nodes: ChainNode[];
  participants: ChainParticipant[];
  totalQuestions: number;
}
