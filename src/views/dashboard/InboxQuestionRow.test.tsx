import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '../../test/test-utils';
import { buildQuestion, buildVideo } from '../../test/mock-data';
import { InboxQuestionRow } from './InboxQuestionRow';

function makeFile(name = 'clip.mp4', sizeMB = 1, type = 'video/mp4'): File {
  const bytes = new Uint8Array(sizeMB * 1024 * 1024);
  return new File([bytes], name, { type });
}

describe('InboxQuestionRow', () => {
  it('renders question text, +1 count, and author handle', () => {
    const q = buildQuestion({
      text: 'Will you fund schools?',
      plusOneCount: 12,
      authorHandle: '@alice',
    });
    render(<InboxQuestionRow question={q} onSubmitAnswer={vi.fn()} />);

    expect(screen.getByText('Will you fund schools?')).toBeInTheDocument();
    expect(screen.getByText('+12')).toBeInTheDocument();
    expect(screen.getByText('@alice')).toBeInTheDocument();
  });

  it('shows SUGGESTED BY REP. badge for editorially-seeded questions', () => {
    const q = buildQuestion({ isSeed: true, plusOneCount: 0 });
    render(<InboxQuestionRow question={q} onSubmitAnswer={vi.fn()} />);
    expect(screen.getByText('SUGGESTED BY REP.')).toBeInTheDocument();
  });

  it('shows ANSWERED badge and hides the upload UI for answered questions', () => {
    const q = buildQuestion({ state: 'answered' });
    render(<InboxQuestionRow question={q} onSubmitAnswer={vi.fn()} />);

    expect(screen.getByText('ANSWERED')).toBeInTheDocument();
    expect(screen.queryByText(/publish answer/i)).not.toBeInTheDocument();
  });

  it('rejects files over the 100MB limit and surfaces an error', async () => {
    const user = userEvent.setup();
    const q = buildQuestion();
    const onSubmit = vi.fn();
    render(<InboxQuestionRow question={q} onSubmitAnswer={onSubmit} />);

    const big = makeFile('huge.mp4', 101);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, big);

    expect(screen.getByText(/under 100MB/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits selected file with optional caption and clears state on success', async () => {
    const user = userEvent.setup();
    const q = buildQuestion({ id: 'q-1' });
    const onSubmit = vi.fn().mockResolvedValue(buildVideo());
    render(<InboxQuestionRow question={q} onSubmitAnswer={onSubmit} />);

    const file = makeFile('reply.mp4', 1);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    const captionBox = screen.getByPlaceholderText(/optional caption/i);
    await user.type(captionBox, 'Here is my answer');

    await user.click(screen.getByRole('button', { name: /publish answer/i }));

    expect(onSubmit).toHaveBeenCalledWith('q-1', file, 'Here is my answer');
  });

  it('shows error status when submit rejects', async () => {
    const user = userEvent.setup();
    const q = buildQuestion();
    const onSubmit = vi.fn().mockRejectedValue(new Error('upload boom'));
    render(<InboxQuestionRow question={q} onSubmitAnswer={onSubmit} />);

    const file = makeFile();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);
    await user.click(screen.getByRole('button', { name: /publish answer/i }));

    expect(await screen.findByText('upload boom')).toBeInTheDocument();
  });
});
