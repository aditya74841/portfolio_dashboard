import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDiaryStore, DiaryEntry, getTodayDateString } from '../use-diary-store';
import { apiFetch } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
}));

describe('useDiaryStore', () => {
  const mockEntry: DiaryEntry = {
    _id: '1',
    userId: 'user-1',
    date: '2026-09-04',
    content: '<p>Today was productive</p>',
    mood: 'Productive',
    wordCount: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useDiaryStore.setState({
      entries: [],
      activeEntry: null,
      selectedDate: getTodayDateString(),
      isLoading: false,
      isSaving: false,
    });
  });

  it('fetches today entry successfully', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(mockEntry);

    const result = await useDiaryStore.getState().fetchTodayEntry();

    expect(apiFetch).toHaveBeenCalledWith('/diary/today');
    expect(result).toEqual(mockEntry);
    expect(useDiaryStore.getState().activeEntry).toEqual(mockEntry);
    expect(useDiaryStore.getState().isLoading).toBe(false);
  });

  it('fetches entry by date successfully', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(mockEntry);

    await useDiaryStore.getState().fetchEntryByDate('2026-09-04');

    expect(apiFetch).toHaveBeenCalledWith('/diary/date/2026-09-04');
    expect(useDiaryStore.getState().selectedDate).toBe('2026-09-04');
    expect(useDiaryStore.getState().activeEntry).toEqual(mockEntry);
  });

  it('saves entry successfully', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(mockEntry);

    const saved = await useDiaryStore.getState().saveEntry('2026-09-04', '<p>Today was productive</p>', 'Productive');

    expect(apiFetch).toHaveBeenCalledWith('/diary', {
      method: 'POST',
      body: JSON.stringify({ date: '2026-09-04', content: '<p>Today was productive</p>', mood: 'Productive' }),
    });
    expect(saved).toEqual(mockEntry);
    expect(useDiaryStore.getState().activeEntry).toEqual(mockEntry);
  });

  it('deletes entry successfully', async () => {
    useDiaryStore.setState({ entries: [mockEntry], activeEntry: mockEntry });
    vi.mocked(apiFetch).mockResolvedValueOnce(undefined);

    await useDiaryStore.getState().deleteEntry('1');

    expect(apiFetch).toHaveBeenCalledWith('/diary/1', { method: 'DELETE' });
    expect(useDiaryStore.getState().entries).toHaveLength(0);
  });
});
