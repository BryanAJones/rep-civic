import { render, screen } from '@testing-library/react';
import { ChainRespondChips } from './ChainRespondChips';
import type { ChainParticipant } from '../../types/domain';

const names: Record<string, string> = {
  'c-1': 'Marcus Johnson',
  'c-2': 'Angela Reed',
};

describe('ChainRespondChips', () => {
  it('renders nothing when all participants have used their responses', () => {
    const participants: ChainParticipant[] = [
      { candidateId: 'c-1', responsesUsed: 2, responsesAllowed: 2 },
      { candidateId: 'c-2', responsesUsed: 2, responsesAllowed: 2 },
    ];

    const { container } = render(
      <ChainRespondChips participants={participants} candidateNames={names} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('shows chip only for participants with remaining responses', () => {
    const participants: ChainParticipant[] = [
      { candidateId: 'c-1', responsesUsed: 2, responsesAllowed: 2 },
      { candidateId: 'c-2', responsesUsed: 1, responsesAllowed: 2 },
    ];

    render(
      <ChainRespondChips participants={participants} candidateNames={names} />,
    );

    expect(screen.getByText('Angela Reed')).toBeInTheDocument();
    expect(screen.queryByText('Marcus Johnson')).not.toBeInTheDocument();
    expect(screen.getByText('1 remaining')).toBeInTheDocument();
  });

  it('shows chips for all participants who can still respond', () => {
    const participants: ChainParticipant[] = [
      { candidateId: 'c-1', responsesUsed: 0, responsesAllowed: 2 },
      { candidateId: 'c-2', responsesUsed: 1, responsesAllowed: 2 },
    ];

    render(
      <ChainRespondChips participants={participants} candidateNames={names} />,
    );

    expect(screen.getByText('Marcus Johnson')).toBeInTheDocument();
    expect(screen.getByText('2 remaining')).toBeInTheDocument();
    expect(screen.getByText('Angela Reed')).toBeInTheDocument();
    expect(screen.getByText('1 remaining')).toBeInTheDocument();
  });

  it('displays the "Can respond" label', () => {
    const participants: ChainParticipant[] = [
      { candidateId: 'c-1', responsesUsed: 0, responsesAllowed: 2 },
    ];

    render(
      <ChainRespondChips participants={participants} candidateNames={names} />,
    );

    expect(screen.getByText('Can respond')).toBeInTheDocument();
  });
});
