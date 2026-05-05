import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/test-utils';
import { buildCandidate, buildQuestion } from '../../test/mock-data';
import { createMockService } from '../../test/mock-service';

const mockService = createMockService();

vi.mock('../../services', () => ({
  get service() {
    return mockService;
  },
}));

import { DashboardPage } from './DashboardPage';

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state while the claim is resolving', () => {
    mockService.getMyClaim = vi.fn().mockReturnValue(new Promise(() => {}));
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
  });

  it('redirects to /app/you when the user has no claim', async () => {
    mockService.getMyClaim = vi.fn().mockResolvedValue(null);
    renderWithProviders(<DashboardPage />);
    // Navigate renders nothing; just confirm header never shows
    await waitFor(() => {
      expect(screen.queryByText(/inbox/i)).not.toBeInTheDocument();
    });
  });

  it('renders header, unanswered inbox count, and groups answered separately', async () => {
    const claim = buildCandidate({
      id: 'c-claimed',
      name: 'Senator Banks',
      officeTitle: 'US Senate',
      party: 'Independent',
    });
    mockService.getMyClaim = vi.fn().mockResolvedValue(claim);
    mockService.getDashboardInbox = vi.fn().mockResolvedValue([
      buildQuestion({ id: 'q-1', text: 'Open question one', state: 'default', plusOneCount: 9 }),
      buildQuestion({ id: 'q-2', text: 'Open question two', state: 'voted', plusOneCount: 4 }),
      buildQuestion({ id: 'q-3', text: 'Already answered', state: 'answered', plusOneCount: 22 }),
    ]);

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Senator Banks')).toBeInTheDocument();
    });

    expect(screen.getByText('US Senate')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Open question one')).toBeInTheDocument();
    });
    expect(screen.getByText('Open question two')).toBeInTheDocument();
    expect(screen.getByText('Already answered')).toBeInTheDocument();

    // Inbox count badge shows 2 unanswered
    const inboxHeading = screen.getByRole('heading', { name: /inbox/i });
    expect(inboxHeading.textContent).toContain('2');

    // Answered section visible
    expect(screen.getByRole('heading', { name: /answered/i })).toBeInTheDocument();
  });

  it('shows empty inbox copy when there are no unanswered questions', async () => {
    mockService.getMyClaim = vi.fn().mockResolvedValue(buildCandidate({ id: 'c-x' }));
    mockService.getDashboardInbox = vi.fn().mockResolvedValue([]);

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/no unanswered questions yet/i)).toBeInTheDocument();
    });
  });
});
