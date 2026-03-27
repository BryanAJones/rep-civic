import { renderHook, waitFor } from '@testing-library/react';
import { createMockService } from '../test/mock-service';
import { buildVideo } from '../test/mock-data';

const mockService = createMockService();

vi.mock('../services', () => ({
  service: mockService,
}));

const { useVideoFeed } = await import('./useVideoFeed');

describe('useVideoFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockService.getFeedVideos = vi.fn().mockResolvedValue([]);
  });

  it('fetches videos for given districtCodes', async () => {
    const videos = [buildVideo({ id: 'v-1' }), buildVideo({ id: 'v-2' })];
    mockService.getFeedVideos = vi.fn().mockResolvedValue(videos);

    const { result } = renderHook(() => useVideoFeed(['GA-SEN-D40']));
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.videos).toEqual(videos);
    expect(mockService.getFeedVideos).toHaveBeenCalledWith(['GA-SEN-D40'], undefined);
  });

  it('transitions loading state correctly', async () => {
    mockService.getFeedVideos = vi.fn().mockResolvedValue([]);

    const { result } = renderHook(() => useVideoFeed(['D1']));
    // Initially loading
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('surfaces error on failure', async () => {
    mockService.getFeedVideos = vi.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useVideoFeed(['D1']));
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
  });

  it('refetches when districtCodes change', async () => {
    mockService.getFeedVideos = vi.fn().mockResolvedValue([]);

    const { rerender } = renderHook(
      ({ codes }: { codes: string[] }) => useVideoFeed(codes),
      { initialProps: { codes: ['D1'] } },
    );

    await waitFor(() => {
      expect(mockService.getFeedVideos).toHaveBeenCalledTimes(1);
    });

    rerender({ codes: ['D1', 'D2'] });

    await waitFor(() => {
      expect(mockService.getFeedVideos).toHaveBeenCalledTimes(2);
    });
    expect(mockService.getFeedVideos).toHaveBeenLastCalledWith(['D1', 'D2'], undefined);
  });
});
