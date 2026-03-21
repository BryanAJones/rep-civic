import type { Question } from '../../types/domain';
import { PlusOneButton } from '../primitives';
import './QuestionRow.css';

interface QuestionRowProps {
  question: Question;
  onVote: (questionId: string) => void;
  onWatchReply?: (answerVideoId: string) => void;
}

export function QuestionRow({ question, onVote, onWatchReply }: QuestionRowProps) {
  const handleRowClick = () => {
    if (question.state === 'answered' && question.answerVideoId) {
      onWatchReply?.(question.answerVideoId);
    }
  };

  return (
    <div
      className={`question-row ${question.state === 'voted' ? 'question-row--voted' : ''} ${question.state === 'answered' ? 'question-row--answered' : ''}`}
      onClick={question.state === 'answered' ? handleRowClick : undefined}
    >
      <PlusOneButton
        state={question.state}
        count={question.plusOneCount}
        onVote={() => onVote(question.id)}
        onWatchReply={
          question.answerVideoId
            ? () => onWatchReply?.(question.answerVideoId!)
            : undefined
        }
      />
      <div className="question-row__body">
        <p className="question-row__text">{question.text}</p>
        <div className="question-row__footer">
          <span className="question-row__user">{question.authorHandle}</span>
          {question.state === 'answered' && (
            <span className="question-row__badge">Answered</span>
          )}
        </div>
      </div>
    </div>
  );
}
