import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IdeaCard } from '../idea-card';
import { useIdeaStore, Idea } from '@/store/use-idea-store';

describe('IdeaCard', () => {
  const mockIdea: Idea = {
    _id: '1',
    title: 'Test App',
    description: 'An app for testing',
    status: 'building',
    updates: [
      { _id: 'u1', description: 'First commit', links: [], createdAt: new Date().toISOString() }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockDeleteIdea = vi.fn();
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    useIdeaStore.setState({
      deleteIdea: mockDeleteIdea,
      ideas: [mockIdea],
      currentIdea: null,
      isLoading: false,
    } as any);
  });

  it('renders idea information correctly', () => {
    render(<IdeaCard idea={mockIdea} onClick={mockOnClick} />);
    
    expect(screen.getByText('Test App')).toBeInTheDocument();
    expect(screen.getByText('An app for testing')).toBeInTheDocument();
    expect(screen.getByText('building')).toBeInTheDocument();
    expect(screen.getByText('1 Updates')).toBeInTheDocument();
  });

  it('calls onClick when the card is clicked', async () => {
    const user = userEvent.setup();
    render(<IdeaCard idea={mockIdea} onClick={mockOnClick} />);
    
    const card = screen.getByText('Test App').closest('.group');
    if (card) {
      await user.click(card);
      expect(mockOnClick).toHaveBeenCalledWith(mockIdea);
    }
  });

  it('opens confirm delete dialog when trash icon is clicked', async () => {
    const user = userEvent.setup();
    render(<IdeaCard idea={mockIdea} onClick={mockOnClick} />);
    
    // Find the delete button (trash icon). 
    // Usually it's invisible until hover, but Testing Library ignores CSS visibility by default
    const deleteButton = screen.getByRole('button'); // Only button on the card is the delete button
    
    await user.click(deleteButton);
    
    // Dialog should appear
    expect(screen.getByText('Discard Idea?')).toBeInTheDocument();
  });

  it('calls deleteIdea when confirm dialog is accepted', async () => {
    const user = userEvent.setup();
    render(<IdeaCard idea={mockIdea} onClick={mockOnClick} />);
    
    const deleteButton = screen.getByRole('button');
    await user.click(deleteButton);
    
    const confirmButton = screen.getByRole('button', { name: /delete/i }); // ConfirmDeleteDialog uses "Delete"
    await user.click(confirmButton);
    
    expect(mockDeleteIdea).toHaveBeenCalledWith('1');
  });
});
