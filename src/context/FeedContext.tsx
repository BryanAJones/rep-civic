import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Video, VideoId } from '../types/domain';

interface FeedState {
  videos: Video[];
  activeVideoIndex: number;
  activeDrawerVideoId: VideoId | null;
  setVideos: (videos: Video[]) => void;
  setActiveVideoIndex: (index: number) => void;
  openDrawer: (videoId: VideoId) => void;
  closeDrawer: () => void;
}

const FeedContext = createContext<FeedState | null>(null);

export function FeedProvider({ children }: { children: ReactNode }) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [activeDrawerVideoId, setActiveDrawerVideoId] = useState<VideoId | null>(null);

  return (
    <FeedContext.Provider
      value={{
        videos,
        activeVideoIndex,
        activeDrawerVideoId,
        setVideos,
        setActiveVideoIndex,
        openDrawer: setActiveDrawerVideoId,
        closeDrawer: () => setActiveDrawerVideoId(null),
      }}
    >
      {children}
    </FeedContext.Provider>
  );
}

export function useFeed() {
  const ctx = useContext(FeedContext);
  if (!ctx) throw new Error('useFeed must be used within FeedProvider');
  return ctx;
}
