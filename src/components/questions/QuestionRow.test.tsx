import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionRow } from './QuestionRow';
import { buildQuestion } from '../../test/mock-data';

describe('QuestionRow', () => {
  it('calls onVote when PlusOneButton is clicked in default state', async () => {
    const onVote = vi.fn();
    const question = buildQuestion({ id: 'q-1', state: 'default' });
    render(<QuestionRow question={question} onVote={onVote} />);

    // The PlusOneButton renders a button with aria-label containing "Vote"
    await userEvent.click(screen.getByRole('button'));
    expect(onVote).toHaveBeenCalledWith('q-1');
  });

  it('calls onWatchReply when row is clicked in answered state', async () => {
    const onWatchReply = vi.fn();
    const question = buildQuestion({
      id: 'q-1',
      state: 'answered',
      answerVideoId: 'v-answer-1',
    });
    render(
      <QuestionRow question={question} onVote={vi.fn()} onWatchReply={onWatchReply} />,
    );

    // Click the row (the div), not the button
    const row = screen.getByText(question.text).closest('.question-row')!;
    await userEvent.click(row);
    expect(onWatchReply).toHaveBeenCalledWith('v-answer-1');
  });

  it('does not fire row click in default state', async () => {
    const onWatchReply = vi.fn();
    const question = buildQuestion({ id: 'q-1', state: 'default' });
    render(
      <QuestionRow question={question} onVote={vi.fn()} onWatchReply={onWatchReply} />,
    );

    const row = screen.getByText(question.text).closest('.question-row')!;
    await userEvent.click(row);
    // onWatchReply should not be called from the row click handler
    // (PlusOneButton click might call onVote, but not onWatchReply)
    expect(onWatchReply).not.toHaveBeenCalled();
  });

  it('shows "Answered" badge only in answered state', () => {
    const { rerender } = render(
      <QuestionRow
        question={buildQuestion({ state: 'answered', answerVideoId: 'v-1' })}
        onVote={vi.fn()}
      />,
    );
    expect(screen.getByText('Answered')).toBeInTheDocument();

    rerender(
      <QuestionRow
        question={buildQuestion({ state: 'default' })}
        onVote={vi.fn()}
      />,
    );
    expect(screen.queryByText('Answered')).not.toBeInTheDocument();
  });
});
