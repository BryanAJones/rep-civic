-- Rep. Initial Schema
-- All tables for the civic accountability platform.
-- Phase B1: database-only, no auth yet.

-- ============================================================
-- 1. Districts
-- ============================================================
CREATE TABLE districts (
  code          TEXT PRIMARY KEY,
  level         TEXT NOT NULL CHECK (level IN ('city', 'county', 'state', 'federal')),
  office_title  TEXT NOT NULL,
  district_name TEXT NOT NULL,
  display_label TEXT NOT NULL
);

-- ============================================================
-- 2. Candidates
-- ============================================================
CREATE TABLE candidates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  initials      TEXT NOT NULL,
  office_title  TEXT NOT NULL,
  district_code TEXT NOT NULL REFERENCES districts(code),
  party         TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'unclaimed'
                  CHECK (status IN ('unclaimed', 'claimed', 'active')),
  -- Unclaimed fields (from GA SOS filings)
  filing_id     TEXT,
  filing_date   TEXT,
  campaign_url  TEXT,
  opponent_count INT DEFAULT 0,
  -- Aggregate counters (denormalized for read performance)
  video_count            INT DEFAULT 0,
  question_count         INT DEFAULT 0,
  answered_question_count INT DEFAULT 0,
  response_rate          REAL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_candidates_district ON candidates(district_code);
CREATE INDEX idx_candidates_status ON candidates(status);

-- ============================================================
-- 3. Candidate Positions
-- ============================================================
CREATE TABLE candidate_positions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id  UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  position_text TEXT NOT NULL,
  sort_order    INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_positions_candidate ON candidate_positions(candidate_id);

-- ============================================================
-- 4. Videos
-- ============================================================
CREATE TABLE videos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id        UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  post_type           TEXT NOT NULL CHECK (post_type IN ('statement', 'response-to-opponent', 'qa-reply')),
  caption             TEXT,
  thumbnail_url       TEXT,
  video_url           TEXT,
  reaction_count      INT NOT NULL DEFAULT 0,
  question_count      INT NOT NULL DEFAULT 0,
  published_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  answers_question_id UUID,
  chain_id            UUID,
  chain_depth         INT
);

CREATE INDEX idx_videos_candidate ON videos(candidate_id);
CREATE INDEX idx_videos_published ON videos(published_at DESC);

-- ============================================================
-- 5. Questions
-- ============================================================
CREATE TABLE questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id        UUID REFERENCES videos(id) ON DELETE CASCADE,
  topic_id        UUID,
  candidate_id    UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  text            TEXT NOT NULL,
  author_handle   TEXT NOT NULL,
  plus_one_count  INT NOT NULL DEFAULT 0,
  state           TEXT NOT NULL DEFAULT 'default'
                    CHECK (state IN ('default', 'voted', 'answered')),
  answer_video_id UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_questions_video ON questions(video_id);
CREATE INDEX idx_questions_candidate ON questions(candidate_id);
CREATE INDEX idx_questions_plus_one ON questions(plus_one_count DESC);

-- ============================================================
-- 6. Topics (auto-generated for unclaimed profiles)
-- ============================================================
CREATE TABLE topics (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id  UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  source_badge  TEXT NOT NULL
);

CREATE INDEX idx_topics_candidate ON topics(candidate_id);

-- ============================================================
-- 7. Debate Chains
-- ============================================================
CREATE TABLE debate_chains (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_code   TEXT NOT NULL REFERENCES districts(code),
  topic_label     TEXT NOT NULL,
  opened_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_questions INT NOT NULL DEFAULT 0
);

-- ============================================================
-- 8. Chain Participants
-- ============================================================
CREATE TABLE chain_participants (
  chain_id          UUID NOT NULL REFERENCES debate_chains(id) ON DELETE CASCADE,
  candidate_id      UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  responses_used    INT NOT NULL DEFAULT 0,
  responses_allowed INT NOT NULL DEFAULT 2,
  PRIMARY KEY (chain_id, candidate_id)
);

-- ============================================================
-- 9. Chain Nodes
-- ============================================================
CREATE TABLE chain_nodes (
  video_id        UUID PRIMARY KEY REFERENCES videos(id) ON DELETE CASCADE,
  chain_id        UUID NOT NULL REFERENCES debate_chains(id) ON DELETE CASCADE,
  candidate_id    UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  parent_video_id UUID REFERENCES videos(id),
  depth           INT NOT NULL
);

CREATE INDEX idx_chain_nodes_chain ON chain_nodes(chain_id);

-- ============================================================
-- 10. Question Votes
-- Composite PK enforces one vote per user per question.
-- user_id is UUID (anonymous auth ID in Phase B4, plain device ID until then).
-- ============================================================
CREATE TABLE question_votes (
  user_id     UUID NOT NULL,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, question_id)
);

CREATE INDEX idx_votes_question ON question_votes(question_id);

-- ============================================================
-- 11. Feedback
-- ============================================================
CREATE TABLE feedback (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text       TEXT NOT NULL,
  category   TEXT NOT NULL CHECK (category IN ('bug', 'feature', 'general')),
  email      TEXT,
  page       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 12. Add FK for videos.chain_id now that debate_chains exists
-- ============================================================
ALTER TABLE videos
  ADD CONSTRAINT fk_videos_chain
  FOREIGN KEY (chain_id) REFERENCES debate_chains(id);

-- ============================================================
-- 13. Add FK for questions.topic_id now that topics exists
-- ============================================================
ALTER TABLE questions
  ADD CONSTRAINT fk_questions_topic
  FOREIGN KEY (topic_id) REFERENCES topics(id);

-- ============================================================
-- Row Level Security — public reads, no writes yet
-- ============================================================
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE debate_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE chain_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chain_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables (anon + authenticated)
CREATE POLICY "Public read: districts" ON districts FOR SELECT USING (true);
CREATE POLICY "Public read: candidates" ON candidates FOR SELECT USING (true);
CREATE POLICY "Public read: candidate_positions" ON candidate_positions FOR SELECT USING (true);
CREATE POLICY "Public read: videos" ON videos FOR SELECT USING (true);
CREATE POLICY "Public read: questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Public read: topics" ON topics FOR SELECT USING (true);
CREATE POLICY "Public read: debate_chains" ON debate_chains FOR SELECT USING (true);
CREATE POLICY "Public read: chain_participants" ON chain_participants FOR SELECT USING (true);
CREATE POLICY "Public read: chain_nodes" ON chain_nodes FOR SELECT USING (true);
CREATE POLICY "Public read: question_votes" ON question_votes FOR SELECT USING (true);
-- feedback is NOT publicly readable (admin only via service_role)

-- ============================================================
-- Utility: auto-update updated_at on candidates
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
