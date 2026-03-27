import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlusOneButton } from './PlusOneButton';

describe('PlusOneButton', () => {
  it('calls onVote (not onWatchReply) in default state', async () => {
    const onVote = vi.fn();
    const onWatchReply = vi.fn();
    render(
      <PlusOneButton state="default" count={5} onVote={onVote} onWatchReply={onWatchReply} />,
    );

    await userEvent.click(screen.getByRole('button'));
    expect(onVote).toHaveBeenCalledOnce();
    expect(onWatchReply).not.toHaveBeenCalled();
  });

  it('calls onVote in voted state', async () => {
    const onVote = vi.fn();
    const onWatchReply = vi.fn();
    render(
      <PlusOneButton state="voted" count={6} onVote={onVote} onWatchReply={onWatchReply} />,
    );

    await userEvent.click(screen.getByRole('button'));
    expect(onVote).toHaveBeenCalledOnce();
    expect(onWatchReply).not.toHaveBeenCalled();
  });

  it('calls onWatchReply (not onVote) in answered state', async () => {
    const onVote = vi.fn();
    const onWatchReply = vi.fn();
    render(
      <PlusOneButton state="answered" count={10} onVote={onVote} onWatchReply={onWatchReply} />,
    );

    await userEvent.click(screen.getByRole('button'));
    expect(onWatchReply).toHaveBeenCalledOnce();
    expect(onVote).not.toHaveBeenCalled();
  });

  it('shows checkmark in answered state, +1 otherwise', () => {
    const { rerender } = render(
      <PlusOneButton state="answered" count={3} />,
    );
    expect(screen.getByText('\u2713')).toBeInTheDocument();
    expect(screen.queryByText('+1')).not.toBeInTheDocument();

    rerender(<PlusOneButton state="default" count={3} />);
    expect(screen.getByText('+1')).toBeInTheDocument();
    expect(screen.queryByText('\u2713')).not.toBeInTheDocument();
  });

  it('displays correct aria-label per state', () => {
    const { rerender } = render(
      <PlusOneButton state="default" count={7} />,
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Vote \u2014 7 votes');

    rerender(<PlusOneButton state="voted" count={8} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'You voted \u2014 8 votes');

    rerender(<PlusOneButton state="answered" count={9} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Watch reply');
  });

  it('always displays the count regardless of state', () => {
    const { rerender } = render(
      <PlusOneButton state="default" count={42} />,
    );
    expect(screen.getByText('42')).toBeInTheDocument();

    rerender(<PlusOneButton state="voted" count={42} />);
    expect(screen.getByText('42')).toBeInTheDocument();

    rerender(<PlusOneButton state="answered" count={42} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });
});
