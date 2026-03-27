import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuestionDrawer } from '../../components/questions';
import { useQuestions } from '../../hooks/useQuestions';
import { usePlusOne } from '../../hooks/usePlusOne';
import { useUser } from '../../context/UserContext';
import { useDistrictLevels } from '../../hooks/useDistrictLevels';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { LevelTabStrip } from './LevelTabStrip';
import { FeedPanelConnected } from './FeedPanelConnected';
import type { VideoId } from '../../types/domain';
import './FeedPage.css';

interface DrawerState {
  videoId: VideoId;
  caption: string;
}

export function FeedPage() {
  const { state } = useUser();
  const tabs = useDistrictLevels(state.districts);
  const navigate = useNavigate();

  const [drawerState, setDrawerState] = useState<DrawerState | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Measure container width for swipe calculations
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { activeIndex, offset, isDragging, progress, jumpTo, handlers } = useSwipeGesture({
    panelCount: tabs.length,
    panelWidth: containerWidth,
  });

  // Scroll position memory per panel
  const scrollPositions = useRef(new Map<number, number>());
  const panelRefs = useRef(new Map<number, HTMLDivElement>());

  const savePanelScroll = useCallback((index: number) => {
    const el = panelRefs.current.get(index);
    if (el) {
      scrollPositions.current.set(index, el.scrollTop);
    }
  }, []);

  const restorePanelScroll = useCallback((index: number) => {
    const el = panelRefs.current.get(index);
    const saved = scrollPositions.current.get(index);
    if (el && saved !== undefined) {
      el.scrollTop = saved;
    }
  }, []);

  // Save scroll position of outgoing panel, restore incoming
  const prevIndex = useRef(activeIndex);
  useEffect(() => {
    if (prevIndex.current !== activeIndex) {
      savePanelScroll(prevIndex.current);
      // Defer restore to next frame so the DOM has settled
      requestAnimationFrame(() => restorePanelScroll(activeIndex));
      prevIndex.current = activeIndex;
    }
  }, [activeIndex, savePanelScroll, restorePanelScroll]);

  const handleQuestionsPress = useCallback((videoId: VideoId, caption: string) => {
    setDrawerState({ videoId, caption });
  }, []);

  // Questions drawer hooks
  const { questions, setQuestions, submitQuestion } = useQuestions(drawerState?.videoId ?? null);
  const { vote } = usePlusOne(setQuestions);

  // Carousel style
  const carouselStyle: React.CSSProperties = {
    transform: `translateX(${offset}px)`,
    transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
    width: `${tabs.length * 100}%`,
  };

  return (
    <>
      <LevelTabStrip
        tabs={tabs}
        progress={progress}
        isDragging={isDragging}
        onTabPress={jumpTo}
      />

      <div className="feed-carousel" ref={containerRef}>
        <div
          className="feed-carousel__track"
          style={carouselStyle}
          {...handlers}
        >
          {tabs.map((tab, i) => (
            <div
              key={tab.level ?? 'all'}
              className="feed-carousel__panel"
              style={{ width: `${100 / tabs.length}%` }}
            >
              <FeedPanelConnected
                tab={tab}
                onQuestionsPress={handleQuestionsPress}
                scrollRef={(el) => {
                  if (el) {
                    panelRefs.current.set(i, el);
                  } else {
                    panelRefs.current.delete(i);
                  }
                }}
              />
            </div>
          ))}
        </div>
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
    </>
  );
}
