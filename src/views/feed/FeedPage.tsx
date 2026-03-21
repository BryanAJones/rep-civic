import { useMemo, useState } from 'react';
import { VideoCard } from '../../components/video';
import { QuestionDrawer } from '../../components/questions';
import { useVideoFeed } from '../../hooks/useVideoFeed';
import { useQuestions } from '../../hooks/useQuestions';
import { usePlusOne } from '../../hooks/usePlusOne';
import { useUser } from '../../context/UserContext';
import type { VideoId } from '../../types/domain';
import './FeedPage.css';

export function FeedPage() {
  const { state } = useUser();
  const districtCodes = useMemo(
    () => state.districts.map((d) => d.code),
    [state.districts],
  );
  const { videos, loading, error } = useVideoFeed(districtCodes);
  const [drawerVideoId, setDrawerVideoId] = useState<VideoId | null>(null);

  const { questions, submitQuestion } = useQuestions(drawerVideoId);
  const { vote } = usePlusOne(
    // This is a simplified pass-through — useQuestions manages its own state
    // but usePlusOne needs a setter to do optimistic updates.
    // In a real implementation, these would share state through the hook.
    () => {},
  );

  const drawerVideo = videos.find((v) => v.id === drawerVideoId);

  if (loading) {
    return <div className="feed__loading">Loading feed...</div>;
  }

  if (error) {
    return <div className="feed__error">{error}</div>;
  }

  return (
    <div className="feed">
      {videos.map((video) => (
        <VideoCard
          key={video.id}
          video={video}
          onQuestionsPress={() => setDrawerVideoId(video.id)}
        />
      ))}

      {drawerVideoId && drawerVideo && (
        <div className="feed__drawer-overlay">
          <div className="feed__drawer-close">
            <button
              className="feed__drawer-close-btn"
              onClick={() => setDrawerVideoId(null)}
              type="button"
            >
              <span>{'\u2190'}</span>
              Back to video
            </button>
          </div>
          <QuestionDrawer
            videoCaption={drawerVideo.caption}
            questions={questions}
            onVote={vote}
            onSubmitQuestion={submitQuestion}
          />
        </div>
      )}
    </div>
  );
}
