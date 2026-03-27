import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserProvider } from '../context/UserContext';
import { FeedProvider } from '../context/FeedContext';
import type { ReactElement, ReactNode } from 'react';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialLocalStorage?: Record<string, unknown>;
}

function AllProviders({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <FeedProvider>
        <MemoryRouter>{children}</MemoryRouter>
      </FeedProvider>
    </UserProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {},
) {
  const { initialLocalStorage, ...renderOptions } = options;

  if (initialLocalStorage) {
    localStorage.setItem('rep_user_state', JSON.stringify(initialLocalStorage));
  }

  return render(ui, { wrapper: AllProviders, ...renderOptions });
}

export { render } from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
