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

      {/* Placeholder play button — replaced by real video player later */}
      <div className="video-card__play-area">
        <button className="video-card__play-btn" type="button" aria-label="Play video">
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <circle cx="24" cy="24" r="23" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
            <polygon points="18,14 36,24 18,34" fill="rgba(255,255,255,0.6)" />
          </svg>
        </button>
      </div>

      <VideoRightRail
        reactionCount={video.reactionCount}
        questionCount={video.questionCount}
        onQuestionsPress={onQuestionsPress}
      />

      <div className="video-card__bottom">
        {video.candidateName && (
          <div className="video-card__identity">
            {video.candidateName}
            {video.candidateOffice && <span> · {video.candidateOffice}</span>}
          </div>
        )}
        <VideoCaption text={video.caption} />
        <VideoTag postType={video.postType} />
      </div>

      <div className="video-card__scroll-hint">
        Swipe for next district video
      </div>
    </div>
  );
}
