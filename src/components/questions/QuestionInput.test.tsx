import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionInput } from './QuestionInput';

describe('QuestionInput', () => {
  it('submit button is disabled when input is empty', () => {
    render(<QuestionInput onSubmit={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });

  it('submit button is disabled when input is only whitespace', async () => {
    render(<QuestionInput onSubmit={vi.fn()} />);
    await userEvent.type(screen.getByRole('textbox'), '   ');
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });

  it('submit button is enabled when text is entered', async () => {
    render(<QuestionInput onSubmit={vi.fn()} />);
    await userEvent.type(screen.getByRole('textbox'), 'What is your stance?');
    expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled();
  });

  it('calls onSubmit with trimmed text and clears input on click', async () => {
    const onSubmit = vi.fn();
    render(<QuestionInput onSubmit={onSubmit} />);

    const input = screen.getByRole('textbox');
    await userEvent.type(input, '  Test question  ');
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onSubmit).toHaveBeenCalledWith('Test question');
    expect(input).toHaveValue('');
  });

  it('submits on Enter key', async () => {
    const onSubmit = vi.fn();
    render(<QuestionInput onSubmit={onSubmit} />);

    await userEvent.type(screen.getByRole('textbox'), 'Enter question{Enter}');
    expect(onSubmit).toHaveBeenCalledWith('Enter question');
  });

  it('does not submit on Shift+Enter', async () => {
    const onSubmit = vi.fn();
    render(<QuestionInput onSubmit={onSubmit} />);

    await userEvent.type(screen.getByRole('textbox'), 'Partial text{Shift>}{Enter}{/Shift}');
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
