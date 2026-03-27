import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GeneralQuestionBox } from './GeneralQuestionBox';

describe('GeneralQuestionBox', () => {
  it('renders candidate name in title and placeholder', () => {
    render(
      <GeneralQuestionBox
        candidateName="Terrence Banks"
        questionCount={23}
        onSubmit={vi.fn()}
      />,
    );
    expect(
      screen.getByText('General questions for Terrence Banks'),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Ask Terrence Banks a question...'),
    ).toBeInTheDocument();
  });

  it('renders the question count', () => {
    render(
      <GeneralQuestionBox
        candidateName="Test"
        questionCount={47}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByText('47')).toBeInTheDocument();
  });

  it('calls onSubmit when question is submitted', async () => {
    const onSubmit = vi.fn();
    render(
      <GeneralQuestionBox
        candidateName="Test"
        questionCount={0}
        onSubmit={onSubmit}
      />,
    );

    await userEvent.type(screen.getByRole('textbox'), 'My question{Enter}');
    expect(onSubmit).toHaveBeenCalledWith('My question');
  });
});
