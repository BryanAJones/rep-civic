import type { Question } from '../../types/domain';
import { VideoThumbBar } from './VideoThumbBar';
import { QuestionRow } from './QuestionRow';
import { QuestionInput } from './QuestionInput';
import './QuestionDrawer.css';

interface QuestionDrawerProps {
  videoCaption: string;
  questions: Question[];
  onVote: (questionId: string) => void;
  onWatchReply?: (answerVideoId: string) => void;
  onSubmitQuestion: (text: string) => void;
}

export function QuestionDrawer({
  videoCaption,
  questions,
  onVote,
  onWatchReply,
  onSubmitQuestion,
}: QuestionDrawerProps) {
  return (
    <div className="question-drawer">
      <VideoThumbBar caption={videoCaption} />

      <div className="question-drawer__header">
        <span className="question-drawer__title">Questions</span>
        <span className="question-drawer__count">{questions.length}</span>
      </div>

      <div className="question-drawer__list">
        {questions.length === 0 ? (
          <p className="question-drawer__empty">
            No questions yet. Be the first to ask.
          </p>
        ) : (
          questions.map((q) => (
            <QuestionRow
              key={q.id}
              question={q}
              onVote={onVote}
              onWatchReply={onWatchReply}
            />
          ))
        )}
      </div>

      <QuestionInput onSubmit={onSubmitQuestion} />
    </div>
  );
}
