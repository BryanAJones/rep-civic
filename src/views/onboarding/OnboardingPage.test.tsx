import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { createMockService } from '../../test/mock-service';
import { buildDistrict } from '../../test/mock-data';

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
    const districts = [buildDistrict({ code: 'ATL-SB-D6' })];
    mockService.resolveDistricts = vi.fn().mockResolvedValue(districts);

    renderOnboarding();

    await userEvent.type(screen.getByLabelText(/home address/i), '123 Main St, Atlanta, GA');
    await userEvent.click(screen.getByRole('button', { name: /find my representatives/i }));

    await waitFor(() => {
      expect(mockService.resolveDistricts).toHaveBeenCalledWith('123 Main St, Atlanta, GA');
    });
  });

  it('navigates to /app/feed after successful onboarding', async () => {
    const districts = [buildDistrict({ code: 'ATL-SB-D6' })];
    mockService.resolveDistricts = vi.fn().mockResolvedValue(districts);

    renderOnboarding();

    await userEvent.type(screen.getByLabelText(/home address/i), '123 Main St');
    await userEvent.click(screen.getByRole('button', { name: /find my representatives/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/app/feed', { replace: true });
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
