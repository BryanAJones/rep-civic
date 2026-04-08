import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ScanlineOverlay } from '../../components/primitives';
import { VideoCaption, VideoTag, VideoRightRail } from '../../components/video';
import { QuestionContextBanner } from '../../components/questions';
import { service } from '../../services';
import type { Video, Question } from '../../types/domain';
import './AnswerVideoPage.css';

export function AnswerVideoPage() {
  const { videoId, answerId } = useParams<{ videoId: string; answerId: string }>();
  const navigate = useNavigate();

  const [answerVideo, setAnswerVideo] = useState<Video | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!answerId || !videoId) return;

    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [video, questions] = await Promise.all([
          service.getVideo(answerId!),
          service.getQuestionsForVideo(videoId!),
        ]);
        if (cancelled) return;

        setAnswerVideo(video);

        // Find the question this video answers
        const answered = questions.find(
          (q) => q.answerVideoId === answerId,
        );
        setQuestion(answered ?? null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [answerId, videoId]);

  const handleBack = () => {
    navigate('/app/feed');
  };

  if (loading) {
    return <div className="answer-page__loading">Loading...</div>;
  }

  if (error || !answerVideo) {
    return <div className="answer-page__error">{error ?? 'Video not found'}</div>;
  }

  return (
    <div className="answer-page">
      <div
        className="answer-page__bg"
        style={{ backgroundImage: 'url(/images/representatives.jpg)' }}
        aria-hidden="true"
      />
      <ScanlineOverlay />

      {/* Back button */}
      <div className="answer-page__top">
        <button
          className="answer-page__back"
          onClick={handleBack}
          type="button"
        >
          <span>{'\u2190'}</span>
          Back to feed
        </button>
      </div>

      {/* Play button placeholder */}
      <div className="answer-page__play-area">
        <button className="answer-page__play-btn" type="button" aria-label="Play video">
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <circle cx="24" cy="24" r="23" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
            <polygon points="18,14 36,24 18,34" fill="rgba(255,255,255,0.6)" />
          </svg>
        </button>
      </div>

      {/* Right rail — reactions + share only, no questions button */}
      <div className="answer-page__rail">
        <VideoRightRail
          reactionCount={answerVideo.reactionCount}
          questionCount={answerVideo.questionCount}
        />
      </div>

      {/* Bottom overlay */}
      <div className="answer-page__bottom">
        {question && (
          <QuestionContextBanner questionText={question.text} />
        )}
        <VideoCaption text={answerVideo.caption} />
        <VideoTag postType={answerVideo.postType} />
      </div>

      <div className="answer-page__scroll-hint">
        Swipe for next video
      </div>
    </div>
  );
}
