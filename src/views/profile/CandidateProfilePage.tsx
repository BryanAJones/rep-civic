import { useParams } from 'react-router-dom';
import {
  ProfileHeader,
  ProfileStats,
  ProfileTabs,
  UnclaimedBanner,
  PositionsList,
  VideoGrid,
  EmptyVideoGrid,
} from '../../components/profile';
import { QuestionRow } from '../../components/questions';
import { GeneralQuestionBox, TopicCard } from '../../components/topics';
import { useCandidateProfile } from '../../hooks/useCandidateProfile';
import { usePlusOne } from '../../hooks/usePlusOne';
import { useQuestions } from '../../hooks/useQuestions';
import type { Candidate, CandidateId, Question, Topic, Video } from '../../types/domain';
import './CandidateProfilePage.css';

export function CandidateProfilePage() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const { candidate, videos, questions, topics, loading, error } =
    useCandidateProfile(candidateId);
  const { submitQuestion } = useQuestions(null, candidateId as CandidateId ?? null);
  // usePlusOne needs a setter — profile questions are read-only for now,
  // so optimistic updates won't visually reflect until page reload.
  const { vote } = usePlusOne(() => {});

  if (loading) {
    return <div className="profile-page__loading">Loading profile...</div>;
  }

  if (error || !candidate) {
    return <div className="profile-page__error">{error ?? 'Candidate not found'}</div>;
  }

  // General questions = questions without a topicId
  const generalQuestions = questions.filter((q) => !q.topicId);

  return (
    <div className="profile-page">
      {candidate.status === 'unclaimed' && <UnclaimedBanner />}

      <ProfileHeader candidate={candidate} />
      <ProfileStats candidate={candidate} />

      <ProfileTabs candidateStatus={candidate.status}>
        {(activeTab) => {
          switch (activeTab) {
            case 'positions':
              return renderPositions(candidate);
            case 'videos':
              return renderVideos(candidate, videos);
            case 'qa':
              return renderQA(candidate, generalQuestions, topics, vote, submitQuestion);
          }
        }}
      </ProfileTabs>
    </div>
  );
}

function renderPositions(candidate: Candidate) {
  if (candidate.status !== 'unclaimed' && candidate.positions.length > 0) {
    return <PositionsList positions={candidate.positions} />;
  }
  return (
    <p className="profile-page__stub">
      No stated positions. This profile is built from public filings.
    </p>
  );
}

function renderVideos(candidate: Candidate, videos: Video[]) {
  if (candidate.status === 'claimed') {
    return (
      <EmptyVideoGrid
        candidateName={candidate.name}
        questionCount={candidate.questionCount}
      />
    );
  }
  if (videos.length === 0) {
    return <p className="profile-page__stub">No videos yet.</p>;
  }
  return <VideoGrid videos={videos} />;
}

function renderQA(
  candidate: Candidate,
  generalQuestions: Question[],
  topics: Topic[],
  onVote: (questionId: string) => void,
  onSubmitQuestion: (text: string) => void,
) {
  if (candidate.status === 'unclaimed') {
    return (
      <div className="profile-page__qa">
        <GeneralQuestionBox
          candidateName={candidate.name}
          questionCount={generalQuestions.length}
          onSubmit={onSubmitQuestion}
        />
        {topics.map((topic) => (
          <TopicCard
            key={topic.id}
            topic={topic}
            onVote={onVote}
            onSubmit={onSubmitQuestion}
          />
        ))}
      </div>
    );
  }

  // Claimed / Active: flat question list
  const allQuestions = [...generalQuestions].sort(
    (a, b) => b.plusOneCount - a.plusOneCount,
  );

  if (allQuestions.length === 0) {
    return <p className="profile-page__stub">No questions yet.</p>;
  }

  return (
    <div className="profile-page__qa">
      {allQuestions.map((q) => (
        <QuestionRow key={q.id} question={q} onVote={onVote} />
      ))}
    </div>
  );
}
