import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuestionDrawer } from '../../components/questions';
import { useQuestions } from '../../hooks/useQuestions';
import { usePlusOne } from '../../hooks/usePlusOne';
import { useUser } from '../../context/UserContext';
import { useDistrictLevels } from '../../hooks/useDistrictLevels';
import { useScrollCarousel } from '../../hooks/useScrollCarousel';
import { LevelTabStrip } from './LevelTabStrip';
import { FeedPanelConnected } from './FeedPanelConnected';
import type { CandidateId, VideoId } from '../../types/domain';
import './FeedPage.css';

interface DrawerState {
  videoId: VideoId;
  candidateId: CandidateId;
  caption: string;
}

export function FeedPage() {
  const { state } = useUser();
  const tabs = useDistrictLevels(state.districts);
  const navigate = useNavigate();

  const [drawerState, setDrawerState] = useState<DrawerState | null>(null);

  const { progress, jumpTo, containerRef } = useScrollCarousel(tabs.length);

  // Set --panel-height for VideoCard sizing
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        el.style.setProperty('--panel-height', `${entry.contentRect.height}px`);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef]);

  const handleQuestionsPress = useCallback((videoId: VideoId, candidateId: CandidateId, caption: string) => {
    setDrawerState({ videoId, candidateId, caption });
  }, []);

  // Questions drawer hooks
  const { questions, setQuestions, submitQuestion } = useQuestions(drawerState?.videoId ?? null, drawerState?.candidateId ?? null);
  const { vote } = usePlusOne(setQuestions);

  return (
    <div className="feed-page">
      <LevelTabStrip
        tabs={tabs}
        progress={progress}
        onTabPress={jumpTo}
      />

      <div className="feed-carousel" ref={containerRef}>
        {tabs.map((tab) => (
          <div
            key={tab.level ?? 'all'}
            className="feed-carousel__panel"
          >
            <FeedPanelConnected
              tab={tab}
              onQuestionsPress={handleQuestionsPress}
              scrollRef={() => {}}
            />
          </div>
        ))}
      </div>

      {drawerState && (
        <div className="feed__drawer-overlay">
          <div className="feed__drawer-close">
            <button
              className="feed__drawer-close-btn"
              onClick={() => setDrawerState(null)}
              type="button"
            >
              <span>{'\u2190'}</span>
              Back to video
            </button>
          </div>
          <QuestionDrawer
            videoCaption={drawerState.caption}
            questions={questions}
            onVote={vote}
            onWatchReply={(answerId) =>
              navigate(`/app/feed/video/${drawerState.videoId}/answer/${answerId}`)
            }
            onSubmitQuestion={submitQuestion}
          />
        </div>
      )}
    </div>
  );
}
