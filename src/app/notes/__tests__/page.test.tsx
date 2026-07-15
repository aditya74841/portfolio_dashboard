import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotesPage from '../page';
import { useNoteStore, Note } from '@/store/use-note-store';

vi.mock('@/components/layout/sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar Mock</div>,
}));

vi.mock('@/components/ui/confirm-delete-dialog', () => ({
  ConfirmDeleteDialog: ({ open, onConfirm, onOpenChange }: any) =>
    open ? (
      <div data-testid="delete-dialog">
        <button data-testid="confirm-delete" onClick={onConfirm}>Confirm Delete</button>
        <button data-testid="cancel-delete" onClick={() => onOpenChange(false)}>Cancel</button>
      </div>
    ) : null,
}));

describe('NotesPage', () => {
  const mockNote: Note = {
    _id: '1',
    content: 'My first note\nWith a second line',
    userId: 'user-1',
    createdAt: '2026-07-10T10:00:00.000Z',
    updatedAt: '2026-07-10T12:00:00.000Z',
  };

  const mockNote2: Note = {
    _id: '2',
    content: 'Second note',
    userId: 'user-1',
    createdAt: '2026-07-11T10:00:00.000Z',
    updatedAt: '2026-07-11T12:00:00.000Z',
  };

  const mockFetchNotes = vi.fn();
  const mockCreateNote = vi.fn();
  const mockUpdateNote = vi.fn();
  const mockDeleteNote = vi.fn();
  const mockSetActiveNote = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset store with mock functions
    useNoteStore.setState({
      notes: [mockNote, mockNote2],
      activeNote: null,
      isLoading: false,
      fetchNotes: mockFetchNotes,
      createNote: mockCreateNote,
      updateNote: mockUpdateNote,
      deleteNote: mockDeleteNote,
      setActiveNote: mockSetActiveNote,
    } as any);
  });

  // ─── Rendering ──────────────────────────────────────────────────────

  it('renders sidebar and note list', () => {
    render(<NotesPage />);

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    // Notes heading should appear (may appear multiple times for mobile + desktop)
    expect(screen.getAllByText('Notes').length).toBeGreaterThan(0);
  });

  it('calls fetchNotes on mount', () => {
    render(<NotesPage />);
    expect(mockFetchNotes).toHaveBeenCalled();
  });

  it('displays note titles in the list', () => {
    render(<NotesPage />);

    // Note titles are derived from first line of content
    expect(screen.getAllByText('My first note').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Second note').length).toBeGreaterThan(0);
  });

  it('displays loading state when loading with no notes', () => {
    useNoteStore.setState({ notes: [], isLoading: true } as any);
    render(<NotesPage />);

    // Should not show "No notes yet" while loading
    expect(screen.queryByText('No notes yet')).not.toBeInTheDocument();
  });

  it('displays empty state when no notes exist', () => {
    useNoteStore.setState({ notes: [], isLoading: false } as any);
    render(<NotesPage />);

    expect(screen.getAllByText('No notes yet').length).toBeGreaterThan(0);
  });

  // ─── New Note ───────────────────────────────────────────────────────

  it('clicking + button shows the editor', async () => {
    const user = userEvent.setup();
    render(<NotesPage />);

    // Find a + button (there are multiple for mobile/desktop)
    const newButtons = screen.getAllByLabelText('New note');
    await user.click(newButtons[0]);

    // Editor should now be visible with placeholder text
    expect(screen.getAllByPlaceholderText('Start writing…').length).toBeGreaterThan(0);
  });

  it('clicking + button clears activeNote', async () => {
    const user = userEvent.setup();
    render(<NotesPage />);

    const newButtons = screen.getAllByLabelText('New note');
    await user.click(newButtons[0]);

    expect(mockSetActiveNote).toHaveBeenCalledWith(null);
  });

  // ─── Select Note ────────────────────────────────────────────────────

  it('clicking a note in the list selects it', async () => {
    const user = userEvent.setup();
    render(<NotesPage />);

    // Click on a note item
    const noteButtons = screen.getAllByText('My first note');
    await user.click(noteButtons[0]);

    expect(mockSetActiveNote).toHaveBeenCalledWith(mockNote);
  });

  // ─── Save ───────────────────────────────────────────────────────────

  it('Save button is disabled when content is empty', async () => {
    const user = userEvent.setup();
    render(<NotesPage />);

    // Open editor
    const newButtons = screen.getAllByLabelText('New note');
    await user.click(newButtons[0]);

    // Save buttons should be disabled (empty content)
    const saveButtons = screen.getAllByRole('button', { name: /save/i });
    saveButtons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  // ─── Delete ─────────────────────────────────────────────────────────

  it('shows delete dialog when delete button is clicked', async () => {
    const user = userEvent.setup();

    // Set an active note
    useNoteStore.setState({ activeNote: mockNote } as any);
    render(<NotesPage />);

    // Find and click a delete button
    const deleteButtons = screen.getAllByLabelText('Delete note');
    await user.click(deleteButtons[0]);

    // Dialog should appear
    expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
  });

  it('calls deleteNote when delete is confirmed', async () => {
    const user = userEvent.setup();

    useNoteStore.setState({ activeNote: mockNote } as any);
    render(<NotesPage />);

    // Open delete dialog
    const deleteButtons = screen.getAllByLabelText('Delete note');
    await user.click(deleteButtons[0]);

    // Confirm delete
    const confirmButton = screen.getByTestId('confirm-delete');
    await user.click(confirmButton);

    expect(mockDeleteNote).toHaveBeenCalledWith('1');
  });

  // ─── Date Display ──────────────────────────────────────────────────

  it('displays formatted dates in the note list', () => {
    render(<NotesPage />);

    // Check that dates are rendered (Jul 10 for the first note)
    expect(screen.getAllByText('Jul 10').length).toBeGreaterThan(0);
  });
});
