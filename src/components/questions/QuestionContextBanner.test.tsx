import { render, screen } from '@testing-library/react';
import { QuestionContextBanner } from './QuestionContextBanner';

describe('QuestionContextBanner', () => {
  it('renders the "Answering" label', () => {
    render(<QuestionContextBanner questionText="Test question" />);
    expect(screen.getByText('Answering')).toBeInTheDocument();
  });

  it('renders the question text', () => {
    render(
      <QuestionContextBanner questionText="What is your stance on pre-K funding?" />,
    );
    expect(
      screen.getByText('What is your stance on pre-K funding?'),
    ).toBeInTheDocument();
  });
});
