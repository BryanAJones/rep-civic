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

export type VerifyClaimResult =
  | { status: 'email_sent'; emailHint: string }
  | {
      status: 'social_proof_required';
      pendingClaimId: string;
      code: string;
      instructions: string;
    };

export type SubmitSocialProofResult = {
  status: 'social_proof_submitted';
  pendingClaimId: string;
};

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
   * Initiate a verified candidate claim (B6-1). Resolves to one of three
   * branches based on what the FEC has on file for the candidate:
   *  - email_sent: a magic link was sent to the candidate's filing-on-file
   *                inbox; clicking it from that inbox routes to
   *                /app/claim/finalize where finalizeCandidateClaim runs
   *  - social_proof_required: no email on file; phase 5 will fill the
   *                           verification UI for the returned code
   *  - error responses surface as thrown errors with .code on the result
   *
   * Throws EmailRequiredError if the caller is anonymous.
   */
  verifyCandidateClaim(args: {
    candidateId: CandidateId;
    level: 'federal' | 'state' | 'local';
    filingId: string;
  }): Promise<VerifyClaimResult>;
  /**
   * Submit the URL where the social-proof code was posted. Called only
   * after `verifyCandidateClaim` returned `social_proof_required`. The
   * row stays in `pending` until an admin runs `approve_social_proof`
   * or `reject_social_proof`.
   */
  submitSocialProof(args: {
    candidateId: CandidateId;
    proofUrl: string;
  }): Promise<SubmitSocialProofResult>;
  /**
   * Finalize a claim after the candidate has clicked the magic link in
   * their filing-on-file inbox. Looks up the user's pending claim by
   * their newly-verified email, promotes it, and inserts the
   * candidate_claims row. Returns null if no pending claim exists for
   * this email (link expired or never sent).
   */
  finalizeCandidateClaim(): Promise<{ candidateId: CandidateId; candidateName: string } | null>;
  /**
   * Admin-only sybil revocation (B6-1). Calls the
   * revoke_candidate_claim RPC, which deletes the candidate_claims row,
   * flips candidates.status back to 'unclaimed', and writes
   * claim.revoked to audit_log atomically.
   */
  revokeCandidateClaim(candidateId: CandidateId, reason: string): Promise<void>;
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
