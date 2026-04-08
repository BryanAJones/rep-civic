import type {
  Candidate,
  CandidateId,
  ChainId,
  DebateChain,
  District,
  DistrictCode,
  DistrictLevel,
  Question,
  QuestionId,
  Topic,
  Video,
  VideoId,
} from '../types/domain';

export interface DataService {
  // District resolution
  resolveDistricts(address: string): Promise<District[]>;

  // Feed
  getFeedVideos(districtCodes: DistrictCode[], filter?: DistrictLevel): Promise<Video[]>;

  // Questions
  getQuestionsForVideo(videoId: VideoId): Promise<Question[]>;
  getQuestionsForCandidate(candidateId: CandidateId): Promise<Question[]>;
  // SECURITY: candidateId is a temporary client param for mock data only.
  // Real backend must derive candidateId from the video and authorHandle from the session.
  submitQuestion(
    candidateId: CandidateId,
    videoId: VideoId | null,
    text: string,
    topicId?: string,
  ): Promise<Question>;
  // SECURITY: Server must enforce one vote per (userId, questionId). Client check is UX only.
  voteQuestion(questionId: QuestionId): Promise<{ newCount: number }>;

  // Candidates
  getCandidate(candidateId: CandidateId): Promise<Candidate>;
  getCandidatesForDistrict(districtCode: DistrictCode): Promise<Candidate[]>;
  /** Fetch candidates across multiple districts in a single query. */
  getCandidatesByDistricts(districtCodes: DistrictCode[]): Promise<Candidate[]>;

  // Topics (unclaimed profiles)
  getTopicsForCandidate(candidateId: CandidateId): Promise<Topic[]>;

  // Debate chains
  getDebateChain(chainId: ChainId): Promise<DebateChain>;

  // Videos
  getVideo(videoId: VideoId): Promise<Video>;
  getVideosForCandidate(candidateId: CandidateId): Promise<Video[]>;

  // Feedback
  submitFeedback(feedback: {
    text: string;
    category: 'bug' | 'feature' | 'general';
    email?: string;
    page: string;
  }): Promise<{ id: string }>;
}
