import { supabase } from './supabaseClient';
import { resolveDistricts as geocodioResolve } from './civicApi';
import type { DataService } from './dataService';
import type {
  Candidate,
  CandidateId,
  CandidateStatus,
  ChainId,
  ChainNode,
  ChainParticipant,
  DebateChain,
  District,
  DistrictCode,
  DistrictLevel,
  Question,
  QuestionId,
  QuestionState,
  Topic,
  Video,
  VideoId,
  VideoPostType,
} from '../types/domain';

// ── Row → Domain mappers ────────────────────────────────────

function mapCandidate(row: {
  id: string;
  name: string;
  initials: string;
  office_title: string;
  district_code: string;
  party: string;
  status: string;
  filing_id: string | null;
  filing_date: string | null;
  campaign_url: string | null;
  opponent_count: number | null;
  question_count: number | null;
  video_count: number | null;
  answered_question_count: number | null;
  response_rate: number | null;
}): Candidate {
  const base = {
    id: row.id,
    name: row.name,
    initials: row.initials,
    officeTitle: row.office_title,
    districtCode: row.district_code,
    party: row.party,
  };

  const status = row.status as CandidateStatus;

  if (status === 'active') {
    return {
      ...base,
      status: 'active',
      videoCount: row.video_count ?? 0,
      answeredQuestionCount: row.answered_question_count ?? 0,
      responseRate: row.response_rate ?? 0,
      positions: [],
    };
  }

  if (status === 'claimed') {
    return {
      ...base,
      status: 'claimed',
      videoCount: 0,
      questionCount: row.question_count ?? 0,
      positions: [],
    };
  }

  // Default: unclaimed
  return {
    ...base,
    status: 'unclaimed',
    filingId: row.filing_id ?? '',
    filingDate: row.filing_date ?? '',
    campaignUrl: row.campaign_url ?? undefined,
    opponentCount: row.opponent_count ?? 0,
    questionCount: row.question_count ?? 0,
  };
}

function mapVideo(row: {
  id: string;
  candidate_id: string;
  post_type: string;
  caption: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  reaction_count: number;
  question_count: number;
  published_at: string;
  answers_question_id: string | null;
  chain_id: string | null;
  chain_depth: number | null;
}): Video {
  return {
    id: row.id,
    candidateId: row.candidate_id,
    postType: row.post_type as VideoPostType,
    caption: row.caption ?? '',
    thumbnailUrl: row.thumbnail_url ?? '',
    videoUrl: row.video_url ?? '',
    reactionCount: row.reaction_count,
    questionCount: row.question_count,
    publishedAt: row.published_at,
    answersQuestionId: row.answers_question_id ?? undefined,
    chainId: row.chain_id ?? undefined,
    chainDepth: row.chain_depth ?? undefined,
  };
}

function mapQuestion(row: {
  id: string;
  video_id: string | null;
  topic_id: string | null;
  candidate_id: string;
  text: string;
  author_handle: string;
  plus_one_count: number;
  state: string;
  answer_video_id: string | null;
  created_at: string;
}): Question {
  return {
    id: row.id,
    videoId: row.video_id ?? undefined,
    topicId: row.topic_id ?? undefined,
    candidateId: row.candidate_id,
    text: row.text,
    authorHandle: row.author_handle,
    plusOneCount: row.plus_one_count,
    state: row.state as QuestionState,
    answerVideoId: row.answer_video_id ?? undefined,
    createdAt: row.created_at,
  };
}

// ── Service implementation ──────────────────────────────────

export const supabaseService: DataService = {
  resolveDistricts(address: string): Promise<District[]> {
    return geocodioResolve(address);
  },

  async getFeedVideos(
    districtCodes: DistrictCode[],
    filter?: DistrictLevel,
  ): Promise<Video[]> {
    // Get candidates in user's districts, optionally filtered by level
    let candidateQuery = supabase
      .from('candidates')
      .select('id, district_code')
      .in('district_code', districtCodes);

    if (filter) {
      // Get district codes that match the level filter
      const { data: matchingDistricts } = await supabase
        .from('districts')
        .select('code')
        .eq('level', filter)
        .in('code', districtCodes);

      const filteredCodes = matchingDistricts?.map((d) => d.code) ?? [];
      if (filteredCodes.length === 0) return [];

      candidateQuery = supabase
        .from('candidates')
        .select('id, district_code')
        .in('district_code', filteredCodes);
    }

    const { data: candidates, error: candErr } = await candidateQuery;
    if (candErr) throw candErr;
    if (!candidates || candidates.length === 0) return [];

    const candidateIds = candidates.map((c) => c.id);

    const { data: videoRows, error: vidErr } = await supabase
      .from('videos')
      .select('*')
      .in('candidate_id', candidateIds)
      .order('published_at', { ascending: false });

    if (vidErr) throw vidErr;
    if (!videoRows) return [];

    // Build lookup maps for denormalized fields
    const candidateMap = new Map(candidates.map((c) => [c.id, c]));

    // Get full candidate names for denormalization
    const { data: candidateDetails } = await supabase
      .from('candidates')
      .select('id, name, office_title')
      .in('id', candidateIds);

    const detailMap = new Map(
      (candidateDetails ?? []).map((c) => [c.id, c]),
    );

    // Get district levels for denormalization
    const districtCodesUsed = [
      ...new Set(candidates.map((c) => c.district_code)),
    ];
    const { data: districtRows } = await supabase
      .from('districts')
      .select('code, level')
      .in('code', districtCodesUsed);

    const districtLevelMap = new Map(
      (districtRows ?? []).map((d) => [d.code, d.level as DistrictLevel]),
    );

    return videoRows.map((row) => {
      const video = mapVideo(row);
      const detail = detailMap.get(row.candidate_id);
      const cand = candidateMap.get(row.candidate_id);
      video.candidateName = detail?.name;
      video.candidateOffice = detail?.office_title;
      video.districtLevel = cand
        ? districtLevelMap.get(cand.district_code)
        : undefined;
      return video;
    });
  },

  async getQuestionsForVideo(videoId: VideoId): Promise<Question[]> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('video_id', videoId)
      .order('plus_one_count', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(mapQuestion);
  },

  async getQuestionsForCandidate(candidateId: CandidateId): Promise<Question[]> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('plus_one_count', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(mapQuestion);
  },

  // TEMPORARY: Client-side write until Edge Functions (B3)
  async submitQuestion(
    candidateId: CandidateId,
    videoId: VideoId | null,
    text: string,
    topicId?: string,
  ): Promise<Question> {
    const { data, error } = await supabase
      .from('questions')
      .insert({
        candidate_id: candidateId,
        video_id: videoId,
        text,
        topic_id: topicId ?? null,
        author_handle: '@anonymous',
        plus_one_count: 1,
        state: 'default',
      })
      .select()
      .single();

    if (error) throw error;
    return mapQuestion(data);
  },

  // TEMPORARY: Client-side write until Edge Functions (B3)
  async voteQuestion(questionId: QuestionId): Promise<{ newCount: number }> {
    // Read current count
    const { data: current, error: readErr } = await supabase
      .from('questions')
      .select('plus_one_count')
      .eq('id', questionId)
      .single();

    if (readErr) throw readErr;

    const newCount = (current?.plus_one_count ?? 0) + 1;

    const { error: updateErr } = await supabase
      .from('questions')
      .update({ plus_one_count: newCount })
      .eq('id', questionId);

    if (updateErr) throw updateErr;
    return { newCount };
  },

  async getCandidate(candidateId: CandidateId): Promise<Candidate> {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', candidateId)
      .single();

    if (error) throw error;

    const candidate = mapCandidate(data);

    // Load positions for claimed/active candidates
    if (candidate.status === 'claimed' || candidate.status === 'active') {
      const { data: positions } = await supabase
        .from('candidate_positions')
        .select('position_text')
        .eq('candidate_id', candidateId)
        .order('sort_order', { ascending: true });

      candidate.positions = (positions ?? []).map((p) => p.position_text);
    }

    return candidate;
  },

  async getCandidatesForDistrict(
    districtCode: DistrictCode,
  ): Promise<Candidate[]> {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('district_code', districtCode);

    if (error) throw error;
    return (data ?? []).map(mapCandidate);
  },

  async getTopicsForCandidate(candidateId: CandidateId): Promise<Topic[]> {
    const { data: topicRows, error } = await supabase
      .from('topics')
      .select('*')
      .eq('candidate_id', candidateId);

    if (error) throw error;
    if (!topicRows || topicRows.length === 0) return [];

    // Load questions for each topic
    const topicIds = topicRows.map((t) => t.id);
    const { data: questionRows } = await supabase
      .from('questions')
      .select('*')
      .in('topic_id', topicIds)
      .order('plus_one_count', { ascending: false });

    const questionsByTopic = new Map<string, Question[]>();
    for (const q of questionRows ?? []) {
      const mapped = mapQuestion(q);
      const list = questionsByTopic.get(q.topic_id!) ?? [];
      list.push(mapped);
      questionsByTopic.set(q.topic_id!, list);
    }

    return topicRows.map((t) => ({
      id: t.id,
      candidateId: t.candidate_id,
      title: t.title,
      sourceBadge: t.source_badge,
      questions: questionsByTopic.get(t.id) ?? [],
    }));
  },

  async getDebateChain(chainId: ChainId): Promise<DebateChain> {
    const { data: chain, error: chainErr } = await supabase
      .from('debate_chains')
      .select('*')
      .eq('id', chainId)
      .single();

    if (chainErr) throw chainErr;

    const [{ data: nodeRows }, { data: participantRows }] = await Promise.all([
      supabase
        .from('chain_nodes')
        .select('*')
        .eq('chain_id', chainId)
        .order('depth', { ascending: true }),
      supabase
        .from('chain_participants')
        .select('*')
        .eq('chain_id', chainId),
    ]);

    const nodes: ChainNode[] = (nodeRows ?? []).map((n) => ({
      videoId: n.video_id,
      candidateId: n.candidate_id,
      parentVideoId: n.parent_video_id ?? undefined,
      depth: n.depth,
    }));

    const participants: ChainParticipant[] = (participantRows ?? []).map(
      (p) => ({
        candidateId: p.candidate_id,
        responsesUsed: p.responses_used,
        responsesAllowed: 2,
      }),
    );

    return {
      id: chain.id,
      districtCode: chain.district_code,
      topicLabel: chain.topic_label,
      openedAt: chain.opened_at,
      nodes,
      participants,
      totalQuestions: chain.total_questions,
    };
  },

  async getVideo(videoId: VideoId): Promise<Video> {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .single();

    if (error) throw error;
    return mapVideo(data);
  },

  async getVideosForCandidate(candidateId: CandidateId): Promise<Video[]> {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('published_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(mapVideo);
  },

  // TEMPORARY: Client-side write until Edge Functions (B3)
  async submitFeedback(feedback: {
    text: string;
    category: 'bug' | 'feature' | 'general';
    email?: string;
    page: string;
  }): Promise<{ id: string }> {
    const { data, error } = await supabase
      .from('feedback')
      .insert({
        text: feedback.text,
        category: feedback.category,
        email: feedback.email ?? null,
        page: feedback.page,
      })
      .select('id')
      .single();

    if (error) throw error;
    return { id: data.id };
  },
};
