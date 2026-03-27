import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { createMockService } from '../../test/mock-service';
import type { UnclaimedCandidate, ClaimedCandidate, ActiveCandidate } from '../../types/domain';
import { buildVideo } from '../../test/mock-data';

const mockService = createMockService();

vi.mock('../../services', () => ({
  service: mockService,
}));

const { CandidateProfilePage } = await import('./CandidateProfilePage');
const { UserProvider } = await import('../../context/UserContext');

function renderProfile(candidateId: string) {
  return render(
    <UserProvider>
      <MemoryRouter initialEntries={[`/app/profile/${candidateId}`]}>
        <Routes>
          <Route
            path="/app/profile/:candidateId"
            element={<CandidateProfilePage />}
          />
        </Routes>
      </MemoryRouter>
    </UserProvider>,
  );
}

const unclaimed: UnclaimedCandidate = {
  id: 'c-unclaimed',
  name: 'Terrence Banks',
  initials: 'TB',
  officeTitle: 'Atlanta School Board',
  districtCode: 'ATL-SB-D6',
  party: 'Non-partisan',
  status: 'unclaimed',
  filingId: 'GA SOS #0044821',
  filingDate: '2026-01-15',
  opponentCount: 1,
  questionCount: 47,
};

const claimed: ClaimedCandidate = {
  id: 'c-claimed',
  name: 'Dana Mitchell',
  initials: 'DM',
  officeTitle: 'GA State House',
  districtCode: 'GA-SH-D40',
  party: 'Republican',
  status: 'claimed',
  videoCount: 0,
  questionCount: 19,
  positions: ['Supports school choice.', 'Opposes tax increases.'],
};

const active: ActiveCandidate = {
  id: 'c-active',
  name: 'Sandra Ross',
  initials: 'SR',
  officeTitle: 'Atlanta School Board',
  districtCode: 'ATL-SB-D6',
  party: 'Non-partisan',
  status: 'active',
  videoCount: 8,
  answeredQuestionCount: 12,
  responseRate: 71,
  positions: ['Supports pre-K expansion.'],
};

describe('CandidateProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockService.getVideosForCandidate = vi.fn().mockResolvedValue([]);
  });

  it('renders unclaimed profile with banner', async () => {
    mockService.getCandidate = vi.fn().mockResolvedValue(unclaimed);

    renderProfile('c-unclaimed');

    await waitFor(() => {
      expect(screen.getByText('Terrence Banks')).toBeInTheDocument();
    });

    // UnclaimedBanner should be visible
    expect(
      screen.getByText(/This candidate hasn't joined yet/),
    ).toBeInTheDocument();

    // Should have Positions and Q&A tabs but NOT Videos
    expect(screen.getByRole('tab', { name: 'Positions' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Q&A' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Videos' })).not.toBeInTheDocument();
  });

  it('renders claimed profile with empty video grid', async () => {
    mockService.getCandidate = vi.fn().mockResolvedValue(claimed);

    renderProfile('c-claimed');

    await waitFor(() => {
      expect(screen.getByText('Dana Mitchell')).toBeInTheDocument();
    });

    // No unclaimed banner
    expect(
      screen.queryByText(/This candidate hasn't joined yet/),
    ).not.toBeInTheDocument();

    // Should have all three tabs
    expect(screen.getByRole('tab', { name: 'Positions' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Videos' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Q&A' })).toBeInTheDocument();
  });

  it('renders active profile with real stats', async () => {
    mockService.getCandidate = vi.fn().mockResolvedValue(active);
    mockService.getVideosForCandidate = vi.fn().mockResolvedValue([
      buildVideo({ id: 'v-1', candidateId: 'c-active' }),
    ]);

    renderProfile('c-active');

    await waitFor(() => {
      expect(screen.getByText('Sandra Ross')).toBeInTheDocument();
    });

    // Real stats visible
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('71%')).toBeInTheDocument();
  });

  it('shows error state when candidate not found', async () => {
    mockService.getCandidate = vi.fn().mockRejectedValue(new Error('Not found'));

    renderProfile('c-missing');

    await waitFor(() => {
      expect(screen.getByText('Not found')).toBeInTheDocument();
    });
  });
});
