import { useCallback } from 'react';
import { useVideoFeed } from '../../hooks/useVideoFeed';
import { useCandidateFeed } from '../../hooks/useCandidateFeed';
import type { LevelTab } from '../../hooks/useDistrictLevels';
import type { CandidateId, VideoId } from '../../types/domain';
import { FeedPanel } from './FeedPanel';
import { CandidatePanel } from './CandidatePanel';

interface FeedPanelConnectedProps {
  tab: LevelTab;
  onQuestionsPress: (videoId: VideoId, candidateId: CandidateId, caption: string) => void;
  scrollRef: (el: HTMLDivElement | null) => void;
}

export function FeedPanelConnected({ tab, onQuestionsPress, scrollRef }: FeedPanelConnectedProps) {
  const { videos, loading: videosLoading, error: videosError } = useVideoFeed(tab.districtCodes, tab.level);
  const { candidates, loading: candidatesLoading, error: candidatesError } = useCandidateFeed(tab.districtCodes);

  const handleQuestionsPress = useCallback(
    (videoId: VideoId) => {
      const video = videos.find((v) => v.id === videoId);
      onQuestionsPress(videoId, video?.candidateId ?? '', video?.caption ?? '');
    },
    [videos, onQuestionsPress],
  );

  // Show video feed if videos exist
  if (videosLoading || videos.length > 0 || videosError) {
    return (
      <FeedPanel
        videos={videos}
        loading={videosLoading}
        error={videosError}
        onQuestionsPress={handleQuestionsPress}
        scrollRef={scrollRef}
      />
    );
  }

  // Otherwise show candidate cards
  return (
    <CandidatePanel
      candidates={candidates}
      loading={candidatesLoading}
      error={candidatesError}
      scrollRef={scrollRef}
    />
  );
}
