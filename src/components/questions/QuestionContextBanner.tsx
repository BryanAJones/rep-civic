import './QuestionContextBanner.css';

interface QuestionContextBannerProps {
  questionText: string;
}

export function QuestionContextBanner({ questionText }: QuestionContextBannerProps) {
  return (
    <div className="question-banner">
      <span className="question-banner__label">Answering</span>
      <p className="question-banner__text">{questionText}</p>
    </div>
  );
}
