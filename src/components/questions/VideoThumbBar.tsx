import { ScanlineOverlay } from '../primitives';
import './VideoThumbBar.css';

interface VideoThumbBarProps {
  caption: string;
}

export function VideoThumbBar({ caption }: VideoThumbBarProps) {
  return (
    <div className="video-thumb-bar">
      <ScanlineOverlay />
      <div className="video-thumb-bar__play">{'\u25B6'}</div>
      <p className="video-thumb-bar__caption">
        {`\u201C${caption}\u201D`}
      </p>
    </div>
  );
}
