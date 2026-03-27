import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { FeedProvider, useFeed } from './FeedContext';

const wrapper = ({ children }: { children: ReactNode }) => (
  <FeedProvider>{children}</FeedProvider>
);

describe('FeedContext', () => {
  it('useFeed throws outside FeedProvider', () => {
    expect(() => {
      renderHook(() => useFeed());
    }).toThrow('useFeed must be used within FeedProvider');
  });

  it('openDrawer sets activeDrawerVideoId', () => {
    const { result } = renderHook(() => useFeed(), { wrapper });

    act(() => {
      result.current.openDrawer('v-123');
    });

    expect(result.current.activeDrawerVideoId).toBe('v-123');
  });

  it('closeDrawer clears activeDrawerVideoId to null', () => {
    const { result } = renderHook(() => useFeed(), { wrapper });

    act(() => {
      result.current.openDrawer('v-123');
    });
    expect(result.current.activeDrawerVideoId).toBe('v-123');

    act(() => {
      result.current.closeDrawer();
    });
    expect(result.current.activeDrawerVideoId).toBeNull();
  });
});
