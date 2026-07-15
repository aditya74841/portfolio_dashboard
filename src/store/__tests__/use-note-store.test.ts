import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useNoteStore, Note } from '../use-note-store';
import { apiFetch } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
}));

describe('useNoteStore', () => {
  const mockNote: Note = {
    _id: '1',
    content: 'First line of my note\nSecond line here',
    userId: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockNote2: Note = {
    _id: '2',
    content: 'Another note',
    userId: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useNoteStore.setState({ notes: [], activeNote: null, isLoading: false });
  });

  // ─── fetchNotes ─────────────────────────────────────────────────────

  it('fetches notes successfully', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce([mockNote, mockNote2]);

    await useNoteStore.getState().fetchNotes();

    expect(apiFetch).toHaveBeenCalledWith('/notes');
    expect(useNoteStore.getState().notes).toEqual([mockNote, mockNote2]);
    expect(useNoteStore.getState().isLoading).toBe(false);
  });

  it('sets loading state while fetching', async () => {
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise((resolve) => { resolvePromise = resolve; });
    vi.mocked(apiFetch).mockReturnValueOnce(promise as any);

    const fetchPromise = useNoteStore.getState().fetchNotes();
    expect(useNoteStore.getState().isLoading).toBe(true);

    resolvePromise!([]);
    await fetchPromise;
    expect(useNoteStore.getState().isLoading).toBe(false);
  });

  it('handles fetch error gracefully', async () => {
    vi.mocked(apiFetch).mockRejectedValueOnce(new Error('Network error'));

    await useNoteStore.getState().fetchNotes();

    expect(useNoteStore.getState().notes).toEqual([]);
    expect(useNoteStore.getState().isLoading).toBe(false);
  });

  it('handles null response from fetch', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(null);

    await useNoteStore.getState().fetchNotes();

    expect(useNoteStore.getState().notes).toEqual([]);
  });

  // ─── createNote ─────────────────────────────────────────────────────

  it('creates a note successfully', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(mockNote);

    const result = await useNoteStore.getState().createNote('First line of my note\nSecond line here');

    expect(apiFetch).toHaveBeenCalledWith('/notes', {
      method: 'POST',
      body: JSON.stringify({ content: 'First line of my note\nSecond line here' }),
    });
    expect(result).toEqual(mockNote);
    expect(useNoteStore.getState().notes).toHaveLength(1);
    expect(useNoteStore.getState().notes[0]).toEqual(mockNote);
    expect(useNoteStore.getState().activeNote).toEqual(mockNote);
  });

  it('prepends new note to existing list', async () => {
    useNoteStore.setState({ notes: [mockNote2] });
    vi.mocked(apiFetch).mockResolvedValueOnce(mockNote);

    await useNoteStore.getState().createNote('New note');

    const notes = useNoteStore.getState().notes;
    expect(notes).toHaveLength(2);
    expect(notes[0]._id).toBe('1'); // new note first
    expect(notes[1]._id).toBe('2');
  });

  it('returns null on create error', async () => {
    vi.mocked(apiFetch).mockRejectedValueOnce(new Error('Server error'));

    const result = await useNoteStore.getState().createNote('Will fail');

    expect(result).toBeNull();
    expect(useNoteStore.getState().notes).toHaveLength(0);
  });

  // ─── updateNote ─────────────────────────────────────────────────────

  it('updates a note successfully', async () => {
    const updatedNote = { ...mockNote, content: 'Updated content' };
    useNoteStore.setState({ notes: [mockNote], activeNote: mockNote });
    vi.mocked(apiFetch).mockResolvedValueOnce(updatedNote);

    await useNoteStore.getState().updateNote('1', 'Updated content');

    expect(apiFetch).toHaveBeenCalledWith('/notes/1', {
      method: 'PATCH',
      body: JSON.stringify({ content: 'Updated content' }),
    });
    expect(useNoteStore.getState().notes[0].content).toBe('Updated content');
    expect(useNoteStore.getState().activeNote?.content).toBe('Updated content');
  });

  it('does not change activeNote if updating a different note', async () => {
    const updatedNote2 = { ...mockNote2, content: 'Updated note 2' };
    useNoteStore.setState({ notes: [mockNote, mockNote2], activeNote: mockNote });
    vi.mocked(apiFetch).mockResolvedValueOnce(updatedNote2);

    await useNoteStore.getState().updateNote('2', 'Updated note 2');

    expect(useNoteStore.getState().activeNote?._id).toBe('1');
    expect(useNoteStore.getState().activeNote?.content).toBe(mockNote.content);
  });

  it('handles update error gracefully', async () => {
    useNoteStore.setState({ notes: [mockNote] });
    vi.mocked(apiFetch).mockRejectedValueOnce(new Error('Update failed'));

    await useNoteStore.getState().updateNote('1', 'Will fail');

    // Note should remain unchanged
    expect(useNoteStore.getState().notes[0].content).toBe(mockNote.content);
  });

  // ─── deleteNote ─────────────────────────────────────────────────────

  it('deletes a note successfully', async () => {
    useNoteStore.setState({ notes: [mockNote, mockNote2], activeNote: mockNote });
    vi.mocked(apiFetch).mockResolvedValueOnce(undefined);

    await useNoteStore.getState().deleteNote('1');

    expect(apiFetch).toHaveBeenCalledWith('/notes/1', { method: 'DELETE' });
    expect(useNoteStore.getState().notes).toHaveLength(1);
    expect(useNoteStore.getState().notes[0]._id).toBe('2');
    expect(useNoteStore.getState().activeNote).toBeNull();
  });

  it('does not clear activeNote when deleting a different note', async () => {
    useNoteStore.setState({ notes: [mockNote, mockNote2], activeNote: mockNote });
    vi.mocked(apiFetch).mockResolvedValueOnce(undefined);

    await useNoteStore.getState().deleteNote('2');

    expect(useNoteStore.getState().activeNote?._id).toBe('1');
    expect(useNoteStore.getState().notes).toHaveLength(1);
  });

  it('handles delete error gracefully', async () => {
    useNoteStore.setState({ notes: [mockNote] });
    vi.mocked(apiFetch).mockRejectedValueOnce(new Error('Delete failed'));

    await useNoteStore.getState().deleteNote('1');

    // Note should still be there
    expect(useNoteStore.getState().notes).toHaveLength(1);
  });

  // ─── setActiveNote ──────────────────────────────────────────────────

  it('sets active note', () => {
    useNoteStore.getState().setActiveNote(mockNote);
    expect(useNoteStore.getState().activeNote).toEqual(mockNote);
  });

  it('clears active note when set to null', () => {
    useNoteStore.setState({ activeNote: mockNote });
    useNoteStore.getState().setActiveNote(null);
    expect(useNoteStore.getState().activeNote).toBeNull();
  });
});
