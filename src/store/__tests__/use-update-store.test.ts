import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useUpdateStore } from '../use-update-store';
import { apiFetch } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
}));

describe('useUpdateStore', () => {
  const mockUpdate = {
    _id: '1',
    title: 'Test Update',
    date: new Date().toISOString(),
    qas: [],
    update: 'Test content',
    mood: 'great',
    isPublic: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockTemplate = {
    _id: 't1',
    name: 'Daily',
    questions: ['How was your day?'],
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useUpdateStore.setState({ updates: [], templates: [], activeTemplate: null, isLoading: false });
  });

  // --- Updates ---
  it('fetches updates successfully', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce([mockUpdate]);

    const store = useUpdateStore.getState();
    await store.fetchUpdates();

    expect(apiFetch).toHaveBeenCalledWith('/update');
    expect(useUpdateStore.getState().updates).toEqual([mockUpdate]);
  });

  it('creates an update', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(mockUpdate);

    const store = useUpdateStore.getState();
    await store.createUpdate({ title: 'Test Update', date: mockUpdate.date });

    expect(useUpdateStore.getState().updates).toHaveLength(1);
    expect(useUpdateStore.getState().updates[0].title).toBe('Test Update');
  });

  it('updates content', async () => {
    useUpdateStore.setState({ updates: [mockUpdate as any] });
    const updated = { ...mockUpdate, update: 'New content' };
    vi.mocked(apiFetch).mockResolvedValueOnce(updated);

    const store = useUpdateStore.getState();
    await store.updateContent('1', 'New content');

    expect(useUpdateStore.getState().updates[0].update).toBe('New content');
  });

  // --- QAs ---
  it('adds QA', async () => {
    useUpdateStore.setState({ updates: [mockUpdate as any] });
    const updated = { ...mockUpdate, qas: [{ question: 'Q?', answer: '' }] };
    vi.mocked(apiFetch).mockResolvedValueOnce(updated);

    const store = useUpdateStore.getState();
    await store.addQA('1', 'Q?');

    expect(useUpdateStore.getState().updates[0].qas).toHaveLength(1);
  });

  // --- Templates ---
  it('fetches templates successfully', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce([mockTemplate]);

    const store = useUpdateStore.getState();
    await store.fetchTemplates();

    expect(useUpdateStore.getState().templates).toEqual([mockTemplate]);
  });

  it('creates template', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(mockTemplate);

    const store = useUpdateStore.getState();
    await store.createTemplate('Daily', ['How was your day?']);

    expect(useUpdateStore.getState().templates).toHaveLength(1);
  });
});
