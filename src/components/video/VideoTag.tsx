import type { VideoPostType } from '../../types/domain';
import './VideoTag.css';

// EXTENSIBILITY: add new post types here
const tagConfig: Record<VideoPostType, { label: string; bg: string; color: string; border: string }> = {
  'statement': {
    label: 'Statement',
    bg: 'rgba(13, 31, 60, 0.8)',
    color: 'rgba(184, 146, 42, 0.9)',
    border: 'rgba(184, 146, 42, 0.25)',
  },
  'response-to-opponent': {
    label: 'Response to opponent',
    bg: 'rgba(13, 31, 60, 0.8)',
    color: 'rgba(184, 146, 42, 0.9)',
    border: 'rgba(184, 146, 42, 0.25)',
  },
  'qa-reply': {
    label: 'Q&A reply',
    bg: 'rgba(100, 180, 140, 0.08)',
    color: 'rgba(100, 180, 140, 0.75)',
    border: 'rgba(100, 180, 140, 0.2)',
  },
};

interface VideoTagProps {
  postType: VideoPostType;
}

export function VideoTag({ postType }: VideoTagProps) {
  const config = tagConfig[postType];

  return (
    <span
      className="video-tag"
      style={{
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
      }}
    >
      {config.label}
    </span>
  );
}
