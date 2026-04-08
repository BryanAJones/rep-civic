import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { createMockService } from '../../test/mock-service';
import { buildDistrict, buildCandidate } from '../../test/mock-data';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockService = createMockService();

vi.mock('../../services', () => ({
  service: mockService,
}));

const { OnboardingPage } = await import('./OnboardingPage');
const { UserProvider } = await import('../../context/UserContext');

function renderOnboarding() {
  return render(
    <UserProvider>
      <MemoryRouter initialEntries={['/onboarding']}>
        <OnboardingPage />
      </MemoryRouter>
    </UserProvider>,
  );
}

/** Set up mocks for a successful address submission with candidates. */
function mockSuccessfulSubmit(candidateCount = 6) {
  const district = buildDistrict({ code: 'ATL-SB-D6' });
  const candidates = Array.from({ length: candidateCount }, (_, i) =>
    buildCandidate({
      id: `c-test-${i}`,
      name: `Candidate ${i}`,
      initials: `C${i}`,
      districtCode: district.code,
    }),
  );
  mockService.resolveDistricts = vi.fn().mockResolvedValue([district]);
  mockService.getCandidatesByDistricts = vi.fn().mockResolvedValue(candidates);
  return { district, candidates };
}

describe('OnboardingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders the hero and form', () => {
    renderOnboarding();

    expect(screen.getByText(/Rep/)).toBeInTheDocument();
    expect(screen.getByText('Civic accountability platform')).toBeInTheDocument();
    expect(screen.getByLabelText(/home address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /find my representatives/i })).toBeInTheDocument();
  });

  it('submit button is disabled when address is empty', () => {
    renderOnboarding();

    expect(screen.getByRole('button', { name: /find my representatives/i })).toBeDisabled();
  });

  it('calls resolveDistricts with the entered address', async () => {
    mockSuccessfulSubmit();
    renderOnboarding();

    await userEvent.type(screen.getByLabelText(/home address/i), '123 Main St, Atlanta, GA');
    await userEvent.click(screen.getByRole('button', { name: /find my representatives/i }));

    await waitFor(() => {
      expect(mockService.resolveDistricts).toHaveBeenCalledWith('123 Main St, Atlanta, GA');
    });
  });

  it('shows cascade reveal then navigates on CTA click', async () => {
    mockSuccessfulSubmit(8);
    renderOnboarding();

    await userEvent.type(screen.getByLabelText(/home address/i), '123 Main St');
    await userEvent.click(screen.getByRole('button', { name: /find my representatives/i }));

    // Wait for cascade to appear
    await waitFor(() => {
      expect(screen.getByTestId('cascade-reveal')).toBeInTheDocument();
    });

    // Counter should show candidate count
    expect(screen.getByText('8')).toBeInTheDocument();

    // CTA should appear
    const ctaButton = await screen.findByRole('button', { name: /see what they are saying/i });
    await userEvent.click(ctaButton);

    expect(mockNavigate).toHaveBeenCalledWith('/app/feed', { replace: true });
  });

  it('shows skeleton cards while ballot is loading', async () => {
    const district = buildDistrict({ code: 'ATL-SB-D6' });
    mockService.resolveDistricts = vi.fn().mockResolvedValue([district]);
    // Make getCandidatesByDistricts hang so skeleton stays visible
    mockService.getCandidatesByDistricts = vi.fn().mockReturnValue(new Promise(() => {}));

    renderOnboarding();

    await userEvent.type(screen.getByLabelText(/home address/i), '123 Main St');
    await userEvent.click(screen.getByRole('button', { name: /find my representatives/i }));

    await waitFor(() => {
      expect(screen.getByTestId('cascade-skeleton')).toBeInTheDocument();
    });
  });

  it('shows error state when resolveDistricts fails', async () => {
    mockService.resolveDistricts = vi.fn().mockRejectedValue(new Error('Invalid address'));

    renderOnboarding();

    await userEvent.type(screen.getByLabelText(/home address/i), 'bad address');
    await userEvent.click(screen.getByRole('button', { name: /find my representatives/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid address')).toBeInTheDocument();
    });
  });
});
