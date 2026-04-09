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
  const district = buildDistrict({ code: 'STATE:GA-CD:5', level: 'federal' });
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

/** Helper: submit address and confirm state in the confirm phase. */
async function submitAndConfirm(address = '123 Main St') {
  await userEvent.type(screen.getByLabelText(/home address/i), address);
  await userEvent.click(screen.getByRole('button', { name: /find my representatives/i }));
  // Wait for confirm phase, then click through
  const confirmBtn = await screen.findByRole('button', { name: /that is correct/i });
  await userEvent.click(confirmBtn);
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

    await submitAndConfirm();

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
    const district = buildDistrict({ code: 'STATE:GA-CD:5', level: 'federal' });
    mockService.resolveDistricts = vi.fn().mockResolvedValue([district]);
    // Make getCandidatesByDistricts hang so skeleton stays visible
    mockService.getCandidatesByDistricts = vi.fn().mockReturnValue(new Promise(() => {}));

    renderOnboarding();

    await submitAndConfirm();

    await waitFor(() => {
      expect(screen.getByTestId('cascade-skeleton')).toBeInTheDocument();
    });
  });

  it('shows CTA for low candidate count (< 6)', async () => {
    mockSuccessfulSubmit(3);
    renderOnboarding();

    await submitAndConfirm();

    await waitFor(() => {
      expect(screen.getByTestId('cascade-reveal')).toBeInTheDocument();
    });

    expect(screen.getByText('3')).toBeInTheDocument();
    const ctaButton = await screen.findByRole('button', { name: /see what they are saying/i });
    expect(ctaButton).toBeInTheDocument();
  });

  it('shows confirm phase with state name for GA address', async () => {
    mockSuccessfulSubmit();
    renderOnboarding();

    await userEvent.type(screen.getByLabelText(/home address/i), '123 Main St, Atlanta, GA');
    await userEvent.click(screen.getByRole('button', { name: /find my representatives/i }));

    const confirmBtn = await screen.findByRole('button', { name: /that is correct/i });
    expect(confirmBtn).toBeInTheDocument();
    expect(screen.getByText(/Georgia/)).toBeInTheDocument();
  });

  it('blocks non-GA addresses with state guard message', async () => {
    const district = buildDistrict({ code: 'STATE:OR-CD:2', level: 'federal' });
    mockService.resolveDistricts = vi.fn().mockResolvedValue([district]);

    renderOnboarding();

    await userEvent.type(screen.getByLabelText(/home address/i), '123 Main St, Portland, OR');
    await userEvent.click(screen.getByRole('button', { name: /find my representatives/i }));

    await waitFor(() => {
      expect(screen.getByText(/Oregon/)).toBeInTheDocument();
    });
    expect(screen.getByText(/currently covers/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try a different address/i })).toBeInTheDocument();
  });

  it('retry from confirm returns to input phase', async () => {
    const district = buildDistrict({ code: 'STATE:OR-CD:2', level: 'federal' });
    mockService.resolveDistricts = vi.fn().mockResolvedValue([district]);

    renderOnboarding();

    await userEvent.type(screen.getByLabelText(/home address/i), '123 Main St');
    await userEvent.click(screen.getByRole('button', { name: /find my representatives/i }));

    const retryBtn = await screen.findByRole('button', { name: /try a different address/i });
    await userEvent.click(retryBtn);

    expect(screen.getByLabelText(/home address/i)).toBeInTheDocument();
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
