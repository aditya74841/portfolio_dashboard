import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UpdateCard } from '../update-card';
import { useUpdateStore } from '@/store/use-update-store';

describe('UpdateCard', () => {
  const mockUpdate = {
    _id: '1',
    title: 'Test Update',
    date: new Date().toISOString(),
    qas: [
      { question: 'Q1', answer: 'A1' }
    ],
    update: 'Test content',
    mood: 'great',
    isPublic: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockToggleIsPublic = vi.fn();
  const mockDeleteUpdate = vi.fn();
  const mockUpdateMood = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    useUpdateStore.setState({
      toggleIsPublic: mockToggleIsPublic,
      deleteUpdate: mockDeleteUpdate,
      updateMood: mockUpdateMood,
    } as any);
  });

  it('renders update information correctly', () => {
    render(<UpdateCard update={mockUpdate as any} />);
    
    expect(screen.getByText('Test Update')).toBeInTheDocument();
    expect(screen.getAllByText('Excellent').length).toBeGreaterThan(0); // Mood label for 'great' appears twice (header and expanded section)
    expect(screen.getByText('1 Reflections')).toBeInTheDocument();
  });

  it('toggles visibility when lock icon is clicked', async () => {
    const user = userEvent.setup();
    render(<UpdateCard update={mockUpdate as any} />);
    
    const toggleButton = screen.getByTitle('Make Public');
    await user.click(toggleButton);
    
    expect(mockToggleIsPublic).toHaveBeenCalledWith('1');
  });

  it('can expand to view content', async () => {
    const user = userEvent.setup();
    render(<UpdateCard update={mockUpdate as any} />);
    
    // Initially content might be in DOM but we can test interactions
    const expandButton = screen.getByText('Expand Daily Reflection');
    await user.click(expandButton);
    
    // It should now show "Daily Vibe" etc.
    expect(screen.getByText('Daily Vibe')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });
});
