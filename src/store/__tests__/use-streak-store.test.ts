import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStreakStore } from '../use-streak-store';
import { apiFetch } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
}));

describe('useStreakStore', () => {
  const mockStreak = {
    _id: '1',
    name: 'Read',
    description: 'Read 10 pages',
    streakNumber: [],
    currentStreak: 0,
    longestStreak: 0,
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useStreakStore.setState({ streaks: [], isLoading: false, error: null });
  });

  it('fetches streaks successfully', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ docs: [mockStreak] });

    const store = useStreakStore.getState();
    await store.fetchStreaks();

    expect(apiFetch).toHaveBeenCalledWith('/streak');
    expect(useStreakStore.getState().streaks).toEqual([mockStreak]);
    expect(useStreakStore.getState().isLoading).toBe(false);
  });

  it('creates a streak successfully', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({}); // create response
    vi.mocked(apiFetch).mockResolvedValueOnce({ docs: [mockStreak] }); // fetch response

    const store = useStreakStore.getState();
    await store.createStreak('Read', 'Read 10 pages');

    expect(apiFetch).toHaveBeenCalledWith('/streak', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ name: 'Read', description: 'Read 10 pages' })
    }));
    // Should fetch again after creation
    expect(apiFetch).toHaveBeenCalledTimes(2);
    expect(useStreakStore.getState().streaks).toHaveLength(1);
  });

  it('marks a streak complete successfully', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({}); // mark complete
    vi.mocked(apiFetch).mockResolvedValueOnce({ docs: [{ ...mockStreak, currentStreak: 1 }] }); // fetch response

    const store = useStreakStore.getState();
    await store.markStreakComplete('1', 1, 'Did it!');

    expect(apiFetch).toHaveBeenCalledWith('/streak/1/complete', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ streakValue: 1, note: 'Did it!' })
    }));
    expect(apiFetch).toHaveBeenCalledTimes(2);
    expect(useStreakStore.getState().streaks[0].currentStreak).toBe(1);
  });

  it('deletes a streak successfully', async () => {
    useStreakStore.setState({ streaks: [mockStreak as any] });
    vi.mocked(apiFetch).mockResolvedValueOnce({});

    const store = useStreakStore.getState();
    await store.deleteStreak('1');

    expect(apiFetch).toHaveBeenCalledWith('/streak/1', { method: 'DELETE' });
    expect(useStreakStore.getState().streaks).toHaveLength(0);
  });
});
