import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDiaryStore, DiaryEntry, getTodayDateString } from '../use-diary-store';
import { apiFetch } from '@/lib/api';
import { db } from '@/lib/db';

vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
}));

const mockDbStore = new Map<string, any>();

vi.mock('@/lib/db', () => ({
  db: {
    diary: {
      get: vi.fn(async (key: string) => mockDbStore.get(key) || null),
      put: vi.fn(async (entry: any) => {
        mockDbStore.set(entry.date, entry);
        return entry.date;
      }),
      update: vi.fn(async (key: string, changes: any) => {
        const current = mockDbStore.get(key) || {};
        mockDbStore.set(key, { ...current, ...changes });
        return 1;
      }),
      delete: vi.fn(async (key: string) => {
        mockDbStore.delete(key);
      }),
      orderBy: vi.fn(() => ({
        reverse: vi.fn(() => ({
          toArray: vi.fn(async () => Array.from(mockDbStore.values())),
        })),
      })),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          toArray: vi.fn(async () => []),
          count: vi.fn(async () => 0),
        })),
      })),
    },
  },
}));

describe('useDiaryStore (Local-First)', () => {
  const mockEntry: DiaryEntry = {
    _id: '1',
    userId: 'user-1',
    date: '2026-09-04',
    content: '<p>Today was productive</p>',
    mood: 'Productive',
    wordCount: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncStatus: 'synced',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockDbStore.clear();
    useDiaryStore.setState({
      entries: [],
      activeEntry: null,
      selectedDate: getTodayDateString(),
      isLoading: false,
      isSaving: false,
      isSyncing: false,
      syncState: 'synced',
      pendingCount: 0,
    });
  });

  it('fetches today entry with client date query param', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(mockEntry);

    const result = await useDiaryStore.getState().fetchTodayEntry();

    expect(apiFetch).toHaveBeenCalledWith(expect.stringContaining('/diary/today?date='));
    expect(result).toEqual(mockEntry);
    expect(useDiaryStore.getState().activeEntry?.content).toBe(mockEntry.content);
  });

  it('fetches entry by date from local database immediately', async () => {
    // Pre-populate IndexedDB
    mockDbStore.set('2026-09-04', mockEntry);
    vi.mocked(apiFetch).mockResolvedValueOnce(mockEntry);

    await useDiaryStore.getState().fetchEntryByDate('2026-09-04');

    expect(db.diary.get).toHaveBeenCalledWith('2026-09-04');
    expect(useDiaryStore.getState().selectedDate).toBe('2026-09-04');
    expect(useDiaryStore.getState().activeEntry).toEqual(mockEntry);
  });

  it('saveLocalEntry saves specifically to IndexedDB with pending status', async () => {
    const saved = await useDiaryStore.getState().saveLocalEntry('2026-09-04', '<p>Local draft</p>', 'Calm');

    expect(db.diary.put).toHaveBeenCalledWith(
      expect.objectContaining({
        date: '2026-09-04',
        content: '<p>Local draft</p>',
        mood: 'Calm',
        syncStatus: 'pending',
      })
    );
    expect(apiFetch).not.toHaveBeenCalled();
    expect(saved.content).toBe('<p>Local draft</p>');
    expect(useDiaryStore.getState().activeEntry?.content).toBe('<p>Local draft</p>');
  });

  it('saves entry locally first and then syncs to cloud', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(mockEntry);

    const saved = await useDiaryStore.getState().saveEntry('2026-09-04', '<p>Today was productive</p>', 'Productive');

    // Verify written to local IndexedDB
    expect(db.diary.put).toHaveBeenCalledWith(
      expect.objectContaining({
        date: '2026-09-04',
        content: '<p>Today was productive</p>',
        mood: 'Productive',
        syncStatus: 'pending',
      })
    );

    // Verify sent to API
    expect(apiFetch).toHaveBeenCalledWith('/diary', {
      method: 'POST',
      body: JSON.stringify({ date: '2026-09-04', content: '<p>Today was productive</p>', mood: 'Productive' }),
    });

    expect(saved?.content).toBe(mockEntry.content);
    expect(useDiaryStore.getState().syncState).toBe('synced');
  });

  it('deletes entry from both local database and cloud', async () => {
    mockDbStore.set('2026-09-04', mockEntry);
    useDiaryStore.setState({ entries: [mockEntry], activeEntry: mockEntry });
    vi.mocked(apiFetch).mockResolvedValueOnce(undefined);

    await useDiaryStore.getState().deleteEntry('1');

    expect(db.diary.delete).toHaveBeenCalledWith('2026-09-04');
    expect(apiFetch).toHaveBeenCalledWith('/diary/1', { method: 'DELETE' });
    expect(useDiaryStore.getState().entries).toHaveLength(0);
  });
});
