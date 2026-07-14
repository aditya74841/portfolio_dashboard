import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IdeasPage from '../page';
import { useIdeaStore, Idea } from '@/store/use-idea-store';
import { useAuthStore } from '@/store/use-auth-store';

vi.mock('@/components/layout/sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar Mock</div>,
}));

describe('IdeasPage', () => {
  const mockIdea: Idea = {
    _id: '1',
    title: 'Test App',
    description: 'An app for testing',
    status: 'building',
    updates: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockFetchIdeas = vi.fn();
  const mockCreateIdea = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    useAuthStore.setState({ isAuthenticated: true } as any);
    
    useIdeaStore.setState({
      ideas: [mockIdea],
      isLoading: false,
      fetchIdeas: mockFetchIdeas,
      createIdea: mockCreateIdea,
    } as any);
  });

  it('renders correctly and fetches ideas on mount', () => {
    render(<IdeasPage />);
    
    expect(mockFetchIdeas).toHaveBeenCalled();
    expect(screen.getByText('Test App')).toBeInTheDocument();
    expect(screen.getByText('Idea Center')).toBeInTheDocument();
  });

  it('filters ideas by search text', async () => {
    const user = userEvent.setup();
    render(<IdeasPage />);
    
    const searchInput = screen.getByPlaceholderText('Search your mind...');
    
    // Initially the idea is visible
    expect(screen.getByText('Test App')).toBeInTheDocument();
    
    // Type something that doesn't match
    await user.type(searchInput, 'XYZ123');
    
    // Idea should disappear
    expect(screen.queryByText('Test App')).not.toBeInTheDocument();
    
    // Type something that matches
    await user.clear(searchInput);
    await user.type(searchInput, 'Test App');
    
    // Idea should be visible again
    expect(screen.getByText('Test App')).toBeInTheDocument();
  });

  it('opens creation dialog and submits new idea', async () => {
    const user = userEvent.setup();
    render(<IdeasPage />);
    
    // Click New Idea button
    const newIdeaButton = screen.getByRole('button', { name: /new idea/i });
    await user.click(newIdeaButton);
    
    // Dialog should be open
    expect(screen.getByText('Capture New Idea')).toBeInTheDocument();
    
    const titleInput = screen.getByLabelText('Title');
    const descInput = screen.getByLabelText('Vision / Description');
    
    await user.type(titleInput, 'New Vision');
    await user.type(descInput, 'Description of new vision');
    
    // Click Save Idea
    const submitButton = screen.getByRole('button', { name: /save idea/i });
    await user.click(submitButton);
    
    expect(mockCreateIdea).toHaveBeenCalledWith({
      title: 'New Vision',
      description: 'Description of new vision',
      status: 'idea'
    });
  });

  it('displays empty state when no ideas exist', () => {
    useIdeaStore.setState({ ideas: [], isLoading: false } as any);
    render(<IdeasPage />);
    
    expect(screen.getByText('No ideas found')).toBeInTheDocument();
  });
});
