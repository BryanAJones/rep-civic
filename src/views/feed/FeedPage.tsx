import { useMemo } from 'react';
import { VideoCard } from '../../components/video';
import { useVideoFeed } from '../../hooks/useVideoFeed';
import { useUser } from '../../context/UserContext';
import './FeedPage.css';

export function FeedPage() {
  const { state } = useUser();
  const districtCodes = useMemo(
    () => state.districts.map((d) => d.code),
    [state.districts],
  );
  const { videos, loading, error } = useVideoFeed(districtCodes);

  if (loading) {
    return <div className="feed__loading">Loading feed...</div>;
  }

  if (error) {
    return <div className="feed__error">{error}</div>;
  }

  return (
    <div className="feed">
      {videos.map((video) => (
        <VideoCard
          key={video.id}
          video={video}
        />
      ))}
    </div>
  );
}
