import { useCallback } from 'react';
import { useVideoFeed } from '../../hooks/useVideoFeed';
import type { LevelTab } from '../../hooks/useDistrictLevels';
import type { VideoId } from '../../types/domain';
import { FeedPanel } from './FeedPanel';

interface FeedPanelConnectedProps {
  tab: LevelTab;
  onQuestionsPress: (videoId: VideoId, caption: string) => void;
  scrollRef: (el: HTMLDivElement | null) => void;
}

export function FeedPanelConnected({ tab, onQuestionsPress, scrollRef }: FeedPanelConnectedProps) {
  const { videos, loading, error } = useVideoFeed(tab.districtCodes, tab.level);

  const handleQuestionsPress = useCallback(
    (videoId: VideoId) => {
      const video = videos.find((v) => v.id === videoId);
      onQuestionsPress(videoId, video?.caption ?? '');
    },
    [videos, onQuestionsPress],
  );

  return (
    <FeedPanel
      videos={videos}
      loading={loading}
      error={error}
      onQuestionsPress={handleQuestionsPress}
      scrollRef={scrollRef}
    />
  );
}
