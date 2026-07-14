import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useIdeaStore, Idea } from '../use-idea-store';
import { apiFetch } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
}));

describe('useIdeaStore', () => {
  const mockIdea: Idea = {
    _id: '1',
    title: 'Test Idea',
    description: 'A great idea',
    status: 'idea',
    updates: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useIdeaStore.setState({ ideas: [], currentIdea: null, isLoading: false });
  });

  it('fetches ideas successfully', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ ideas: [mockIdea] });

    const store = useIdeaStore.getState();
    await store.fetchIdeas();

    expect(apiFetch).toHaveBeenCalledWith('/idea');
    expect(useIdeaStore.getState().ideas).toEqual([mockIdea]);
    expect(useIdeaStore.getState().isLoading).toBe(false);
  });

  it('creates an idea successfully', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(mockIdea);

    const store = useIdeaStore.getState();
    await store.createIdea({ title: 'Test Idea', description: 'A great idea' });

    expect(apiFetch).toHaveBeenCalledWith('/idea', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ title: 'Test Idea', description: 'A great idea' })
    }));
    expect(useIdeaStore.getState().ideas).toHaveLength(1);
    expect(useIdeaStore.getState().ideas[0]).toEqual(mockIdea);
  });

  it('updates an idea successfully', async () => {
    useIdeaStore.setState({ ideas: [mockIdea] });
    const updatedIdea = { ...mockIdea, title: 'Updated Idea' };
    vi.mocked(apiFetch).mockResolvedValueOnce(updatedIdea);

    const store = useIdeaStore.getState();
    await store.updateIdea('1', { title: 'Updated Idea' });

    expect(apiFetch).toHaveBeenCalledWith('/idea/1', expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated Idea' })
    }));
    expect(useIdeaStore.getState().ideas[0].title).toBe('Updated Idea');
  });

  it('deletes an idea successfully', async () => {
    useIdeaStore.setState({ ideas: [mockIdea] });
    vi.mocked(apiFetch).mockResolvedValueOnce({});

    const store = useIdeaStore.getState();
    await store.deleteIdea('1');

    expect(apiFetch).toHaveBeenCalledWith('/idea/1', { method: 'DELETE' });
    expect(useIdeaStore.getState().ideas).toHaveLength(0);
  });

  it('changes idea status', async () => {
    useIdeaStore.setState({ ideas: [mockIdea] });
    const updatedIdea = { ...mockIdea, status: 'building' };
    vi.mocked(apiFetch).mockResolvedValueOnce(updatedIdea);

    const store = useIdeaStore.getState();
    await store.changeStatus('1', 'building');

    expect(apiFetch).toHaveBeenCalledWith('/idea/1/status', expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ status: 'building' })
    }));
    expect(useIdeaStore.getState().ideas[0].status).toBe('building');
  });

  it('adds an update to an idea', async () => {
    useIdeaStore.setState({ ideas: [mockIdea] });
    const mockUpdate = { _id: 'u1', description: 'Log entry', links: [], createdAt: new Date().toISOString() };
    const updatedIdea = { ...mockIdea, updates: [mockUpdate] };
    vi.mocked(apiFetch).mockResolvedValueOnce(updatedIdea);

    const store = useIdeaStore.getState();
    await store.addUpdate('1', 'Log entry', []);

    expect(apiFetch).toHaveBeenCalledWith('/idea/1/updates', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ description: 'Log entry', links: [] })
    }));
    expect(useIdeaStore.getState().ideas[0].updates).toHaveLength(1);
  });
});
