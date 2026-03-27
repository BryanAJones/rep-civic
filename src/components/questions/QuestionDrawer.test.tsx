import { render, screen } from '@testing-library/react';
import { QuestionDrawer } from './QuestionDrawer';
import { buildQuestion } from '../../test/mock-data';

describe('QuestionDrawer', () => {
  const defaultProps = {
    videoCaption: 'Test video',
    questions: [] as ReturnType<typeof buildQuestion>[],
    onVote: vi.fn(),
    onSubmitQuestion: vi.fn(),
  };

  it('displays question count', () => {
    const questions = [
      buildQuestion({ id: 'q-1' }),
      buildQuestion({ id: 'q-2' }),
      buildQuestion({ id: 'q-3' }),
    ];
    render(<QuestionDrawer {...defaultProps} questions={questions} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows empty state message when no questions', () => {
    render(<QuestionDrawer {...defaultProps} questions={[]} />);
    expect(
      screen.getByText('No questions yet. Be the first to ask.'),
    ).toBeInTheDocument();
  });

  it('renders a QuestionRow for each question', () => {
    const questions = [
      buildQuestion({ id: 'q-1', text: 'First question' }),
      buildQuestion({ id: 'q-2', text: 'Second question' }),
    ];
    render(<QuestionDrawer {...defaultProps} questions={questions} />);
    expect(screen.getByText('First question')).toBeInTheDocument();
    expect(screen.getByText('Second question')).toBeInTheDocument();
  });

  it('renders questions in the order provided', () => {
    const questions = [
      buildQuestion({ id: 'q-1', text: 'Alpha', plusOneCount: 3 }),
      buildQuestion({ id: 'q-2', text: 'Beta', plusOneCount: 10 }),
    ];
    render(<QuestionDrawer {...defaultProps} questions={questions} />);

    const rows = screen.getAllByText(/Alpha|Beta/);
    expect(rows[0]!.textContent).toBe('Alpha');
    expect(rows[1]!.textContent).toBe('Beta');
  });
});
