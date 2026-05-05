import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, userEvent } from '../../test/test-utils';
import { buildCandidate, buildQuestion } from '../../test/mock-data';
import { createMockService } from '../../test/mock-service';

const mockService = createMockService();

vi.mock('../../services', () => ({
  get service() {
    return mockService;
  },
}));

import { ProfileFeedPanel } from './ProfileFeedPanel';

describe('ProfileFeedPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no candidates', async () => {
    mockService.getCandidatesByDistricts = vi.fn().mockResolvedValue([]);
    mockService.getTopQuestionsForCandidates = vi.fn().mockResolvedValue(new Map());

    renderWithProviders(<ProfileFeedPanel districtCodes={['STATE:GA-CD:5']} />);

    await waitFor(() => {
      expect(screen.getByText(/no candidates at this level yet/i)).toBeInTheDocument();
    });
  });

  it('renders a card per candidate with their top questions', async () => {
    const c1 = buildCandidate({ id: 'c-1', name: 'Alice', initials: 'A' });
    const c2 = buildCandidate({ id: 'c-2', name: 'Bob', initials: 'B' });
    const q1 = buildQuestion({ id: 'q-1', candidateId: 'c-1', text: 'Will you fund schools?', plusOneCount: 12 });
    const q2 = buildQuestion({ id: 'q-2', candidateId: 'c-2', text: 'Stance on transit?', plusOneCount: 7 });

    mockService.getCandidatesByDistricts = vi.fn().mockResolvedValue([c1, c2]);
    mockService.getTopQuestionsForCandidates = vi.fn().mockResolvedValue(
      new Map([['c-1', [q1]], ['c-2', [q2]]]),
    );

    renderWithProviders(<ProfileFeedPanel districtCodes={['STATE:GA-CD:5']} />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Will you fund schools?')).toBeInTheDocument();
      expect(screen.getByText('Stance on transit?')).toBeInTheDocument();
    });
  });

  it('submits a question via the inline ask input', async () => {
    const user = userEvent.setup();
    const c1 = buildCandidate({ id: 'c-1', name: 'Alice' });
    const submitMock = vi.fn().mockResolvedValue(buildQuestion({ id: 'q-new', candidateId: 'c-1', text: 'Hello?' }));

    mockService.getCandidatesByDistricts = vi.fn().mockResolvedValue([c1]);
    mockService.getTopQuestionsForCandidates = vi.fn().mockResolvedValue(new Map([['c-1', []]]));
    mockService.submitQuestion = submitMock;

    renderWithProviders(<ProfileFeedPanel districtCodes={['STATE:GA-CD:5']} />);

    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());

    const input = screen.getByPlaceholderText(/ask alice a question/i);
    await user.type(input, 'Hello?');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(submitMock).toHaveBeenCalledWith('c-1', null, 'Hello?');
  });
});
