import { useRef, useEffect } from 'react';
import { VideoCard } from '../../components/video';
import type { Video, VideoId } from '../../types/domain';
import './FeedPanel.css';

interface FeedPanelProps {
  videos: Video[];
  loading: boolean;
  error: string | null;
  onQuestionsPress: (videoId: VideoId) => void;
  /** Ref callback to store/restore scroll position */
  scrollRef: (el: HTMLDivElement | null) => void;
}

export function FeedPanel({ videos, loading, error, onQuestionsPress, scrollRef }: FeedPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const setRef = (el: HTMLDivElement | null) => {
    containerRef.current = el;
    scrollRef(el);
  };

  if (loading) {
    return (
      <div className="feed-panel">
        <div className="feed-panel__status">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="feed-panel">
        <div className="feed-panel__status">{error}</div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="feed-panel">
        <div className="feed-panel__status">No videos at this level yet.</div>
      </div>
    );
  }

  return (
    <div className="feed-panel" ref={setRef}>
      {videos.map((video) => (
        <VideoCard
          key={video.id}
          video={video}
          onQuestionsPress={() => onQuestionsPress(video.id)}
        />
      ))}
    </div>
  );
}
