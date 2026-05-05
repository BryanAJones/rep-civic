import { useCallback } from 'react';
import { useVideoFeed } from '../../hooks/useVideoFeed';
import type { LevelTab } from '../../hooks/useDistrictLevels';
import type { CandidateId, VideoId } from '../../types/domain';
import { FeedPanel } from './FeedPanel';
import { ProfileFeedPanel } from './ProfileFeedPanel';

interface FeedPanelConnectedProps {
  tab: LevelTab;
  onQuestionsPress: (videoId: VideoId, candidateId: CandidateId, caption: string) => void;
  scrollRef: (el: HTMLDivElement | null) => void;
}

export function FeedPanelConnected({ tab, onQuestionsPress, scrollRef }: FeedPanelConnectedProps) {
  // Default surface is the profile-first feed: candidates with their top
  // questions and inline +1 / ask. Video feed only appears once a candidate
  // has actually posted videos, which is rare today (most are unclaimed).
  const { videos, loading: videosLoading, error: videosError } = useVideoFeed(tab.districtCodes, tab.level);

  const handleQuestionsPress = useCallback(
    (videoId: VideoId) => {
      const video = videos.find((v) => v.id === videoId);
      onQuestionsPress(videoId, video?.candidateId ?? '', video?.caption ?? '');
    },
    [videos, onQuestionsPress],
  );

  if (!videosLoading && !videosError && videos.length > 0) {
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

  return <ProfileFeedPanel districtCodes={tab.districtCodes} />;
}
