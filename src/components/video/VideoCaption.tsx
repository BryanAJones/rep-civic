import './VideoCaption.css';

interface VideoCaptionProps {
  text: string;
}

export function VideoCaption({ text }: VideoCaptionProps) {
  return <p className="video-caption">{`\u201C${text}\u201D`}</p>;
}
