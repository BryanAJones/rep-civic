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

export interface BallotResult {
  source: 'google' | 'fallback';
  districts: District[];
  electionName?: string;
  electionDate?: string;
}

export interface DataService {
  // District resolution
  resolveDistricts(address: string): Promise<District[]>;

  /**
   * Resolve an address to a ballot slate. Prefers Google Civic's
   * voterInfoQuery during active election windows (returns federal
   * through local races with candidate enrichment). Falls back to
   * Geocodio-based district resolution between elections.
   */
  getBallotForAddress(address: string): Promise<BallotResult>;

  // Feed
  getFeedVideos(districtCodes: DistrictCode[], filter?: DistrictLevel): Promise<Video[]>;

  // Questions
  getQuestionsForVideo(videoId: VideoId): Promise<Question[]>;
  getQuestionsForCandidate(candidateId: CandidateId): Promise<Question[]>;
  /**
   * Batched lookup of top questions per candidate, sorted by +1 count desc.
   * Returns a Map keyed by candidateId. Powers the profile-first feed where
   * each card shows a 2-3 question preview without an N+1 query.
   */
  getTopQuestionsForCandidates(
    candidateIds: CandidateId[],
    limitPerCandidate: number,
  ): Promise<Map<CandidateId, Question[]>>;
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

  // Candidate dashboard (item 67)
  /**
   * Returns the candidate the current user has claimed, or null if they
   * haven't claimed one. Drives the `/app/dashboard` route gate.
   */
  getMyClaim(): Promise<Candidate | null>;
  /**
   * Claim an unclaimed candidate profile for the current (email-verified) user.
   * Throws EmailRequiredError if the caller is anonymous. Resolves to the
   * candidateId on success so the caller can route to /app/dashboard.
   */
  claimCandidate(candidateId: CandidateId): Promise<{ candidateId: CandidateId }>;
  /**
   * Inbox of questions for a candidate, sorted by +1 desc. Includes both
   * unanswered and answered questions so the dashboard can render history.
   */
  getDashboardInbox(candidateId: CandidateId): Promise<Question[]>;
  /**
   * Upload a video file to Supabase Storage under the candidate's path,
   * then finalize via the `submit-video-answer` Edge Function. Returns the
   * created Video row. Caller is responsible for surfacing upload progress.
   */
  submitVideoAnswer(args: {
    candidateId: CandidateId;
    questionId: QuestionId;
    file: File;
    caption?: string;
  }): Promise<Video>;
}
