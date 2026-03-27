import { render, screen } from '@testing-library/react';

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
});

describe('AppRouter route guard', () => {
  it('redirects unauthenticated /app/* users to /onboarding', async () => {
    const App = (await import('../App')).default;

    window.history.pushState({}, '', '/app/feed');

    render(<App />);

    // The onboarding page has an address input — landing page does not
    expect(
      await screen.findByLabelText(/home address/i),
    ).toBeInTheDocument();
  });

  it('allows authenticated users through to the app', async () => {
    localStorage.setItem(
      'rep_user_state',
      JSON.stringify({
        hasCompletedOnboarding: true,
        districts: [
          {
            code: 'ATL-SB-D6',
            level: 'city',
            officeTitle: 'Atlanta School Board',
            districtName: 'District 6',
            displayLabel: 'Atlanta School Board · District 6',
            candidateIds: [],
          },
        ],
        votedQuestionIds: [],
      }),
    );

    const App = (await import('../App')).default;

    window.history.pushState({}, '', '/app/feed');

    render(<App />);

    // Should NOT show onboarding form
    expect(screen.queryByLabelText(/home address/i)).not.toBeInTheDocument();
  });

  it('shows landing page at root /', async () => {
    const App = (await import('../App')).default;

    window.history.pushState({}, '', '/');

    render(<App />);

    // Landing page has the hook headline
    expect(
      await screen.findByText(/you voted for these people/i),
    ).toBeInTheDocument();
  });
});

describe('Persistence round-trip', () => {
  it('restores onboarding state from localStorage on re-mount', async () => {
    localStorage.setItem(
      'rep_user_state',
      JSON.stringify({
        hasCompletedOnboarding: true,
        districts: [
          {
            code: 'GA-SH-D40',
            level: 'state',
            officeTitle: 'GA State House',
            districtName: 'District 40',
            displayLabel: 'GA State House · District 40',
            candidateIds: [],
          },
        ],
        votedQuestionIds: ['q-001'],
      }),
    );

    const App = (await import('../App')).default;

    window.history.pushState({}, '', '/app/feed');

    render(<App />);

    // Should pass through route guard
    expect(screen.queryByLabelText(/home address/i)).not.toBeInTheDocument();
  });
});
