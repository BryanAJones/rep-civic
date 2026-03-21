import type { Video } from '../../types/domain';
import { ScanlineOverlay } from '../primitives';
import { VideoCaption } from './VideoCaption';
import { VideoTag } from './VideoTag';
import { VideoRightRail } from './VideoRightRail';
import './VideoCard.css';

interface VideoCardProps {
  video: Video;
  onQuestionsPress?: () => void;
}

export function VideoCard({ video, onQuestionsPress }: VideoCardProps) {
  return (
    <div className="video-card">
      <ScanlineOverlay />

      <VideoRightRail
        reactionCount={video.reactionCount}
        questionCount={video.questionCount}
        onQuestionsPress={onQuestionsPress}
      />

      <div className="video-card__bottom">
        <VideoCaption text={video.caption} />
        <VideoTag postType={video.postType} />
      </div>

      <div className="video-card__scroll-hint">
        Swipe for next district video
      </div>
    </div>
  );
}
