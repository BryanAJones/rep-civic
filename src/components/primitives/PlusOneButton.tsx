import type { QuestionState } from '../../types/domain';
import './PlusOneButton.css';

interface PlusOneButtonProps {
  state: QuestionState;
  count: number;
  onVote?: () => void;
  onWatchReply?: () => void;
}

export function PlusOneButton({ state, count, onVote, onWatchReply }: PlusOneButtonProps) {
  const handleClick = () => {
    if (state === 'answered') {
      onWatchReply?.();
    } else {
      onVote?.();
    }
  };

  return (
    <button
      className={`plus-one plus-one--${state}`}
      onClick={handleClick}
      type="button"
      aria-label={
        state === 'answered'
          ? 'Watch reply'
          : state === 'voted'
            ? `You voted — ${count} votes`
            : `Vote — ${count} votes`
      }
    >
      <span className="plus-one__mark">
        {state === 'answered' ? '\u2713' : '+1'}
      </span>
      <span className="plus-one__count">{count}</span>
    </button>
  );
}
