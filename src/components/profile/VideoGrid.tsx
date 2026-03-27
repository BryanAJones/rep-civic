import type { Video } from '../../types/domain';
import './VideoGrid.css';

interface VideoGridProps {
  videos: Video[];
}

export function VideoGrid({ videos }: VideoGridProps) {
  return (
    <div className="video-grid">
      {videos.map((video) => (
        <div key={video.id} className="video-grid__cell">
          <div className="video-grid__thumb">
            {video.thumbnailUrl ? (
              <img src={video.thumbnailUrl} alt={video.caption} />
            ) : (
              <div className="video-grid__placeholder" />
            )}
            {video.chainId && (
              <span className="video-grid__chain-badge">
                chain
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
