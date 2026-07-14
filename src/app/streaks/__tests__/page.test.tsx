import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StreaksPage from '../page';
import { useStreakStore } from '@/store/use-streak-store';

vi.mock('@/components/layout/sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar Mock</div>,
}));

describe('StreaksPage', () => {
  const mockStreak = {
    _id: '1',
    name: 'Morning Run',
    description: 'Run 5km',
    streakNumber: [],
    currentStreak: 5,
    longestStreak: 10,
    isActive: true,
    lastCompletedDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
  };

  const mockFetchStreaks = vi.fn();
  const mockCreateStreak = vi.fn();
  const mockMarkStreakComplete = vi.fn();
  const mockDeleteStreak = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    useStreakStore.setState({
      streaks: [mockStreak] as any,
      isLoading: false,
      error: null,
      fetchStreaks: mockFetchStreaks,
      createStreak: mockCreateStreak,
      markStreakComplete: mockMarkStreakComplete,
      deleteStreak: mockDeleteStreak,
    } as any);
    
    // Mock window.confirm for the delete dialog test
    window.confirm = vi.fn(() => true);
  });

  it('renders correctly and fetches streaks on mount', () => {
    render(<StreaksPage />);
    
    expect(mockFetchStreaks).toHaveBeenCalled();
    expect(screen.getByText('Morning Run')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // Current streak
    expect(screen.getByText('10')).toBeInTheDocument(); // Longest streak
  });

  it('opens create modal and submits new streak', async () => {
    const user = userEvent.setup();
    render(<StreaksPage />);
    
    const newStreakButton = screen.getByRole('button', { name: /new streak/i });
    await user.click(newStreakButton);
    
    expect(screen.getByText('Create New Streak')).toBeInTheDocument();
    
    const nameInput = screen.getByPlaceholderText('e.g. Meditate for 10 mins');
    await user.type(nameInput, 'Read Book');
    
    const submitButton = screen.getByRole('button', { name: /^create$/i });
    await user.click(submitButton);
    
    expect(mockCreateStreak).toHaveBeenCalledWith('Read Book', '');
  });

  it('opens complete modal and submits', async () => {
    const user = userEvent.setup();
    render(<StreaksPage />);
    
    const completeButton = screen.getByRole('button', { name: /mark complete for today/i });
    await user.click(completeButton);
    
    expect(screen.getByText('Complete Streak')).toBeInTheDocument();
    
    const noteInput = screen.getByPlaceholderText('How did it go today? (Optional)');
    await user.type(noteInput, 'Felt great!');
    
    const submitButtons = screen.getAllByRole('button', { name: /mark complete/i });
    // The second button is the one in the modal
    await user.click(submitButtons[1]);
    
    // Current streak is 5, so next value is 6
    expect(mockMarkStreakComplete).toHaveBeenCalledWith('1', 6, 'Felt great!');
  });

  it('handles delete streak', async () => {
    const user = userEvent.setup();
    render(<StreaksPage />);
    
    // Trash icon button
    const deleteButtons = screen.getAllByRole('button');
    // Find the one containing the SVG or use an easier selector if available. 
    // Usually it's the only button in the card wrapper with no text.
    // Let's filter by the class or assume it's the second button on the page (after New Streak)
    const deleteButton = deleteButtons.find(b => b.className.includes('absolute'));
    
    if (deleteButton) {
      await user.click(deleteButton);
      expect(window.confirm).toHaveBeenCalled();
      expect(mockDeleteStreak).toHaveBeenCalledWith('1');
    }
  });

  it('renders completed state when already completed today', () => {
    useStreakStore.setState({
      streaks: [{
        ...mockStreak,
        lastCompletedDate: new Date().toISOString() // Today
      }]
    } as any);
    
    render(<StreaksPage />);
    
    expect(screen.getByText('Completed Today')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /mark complete for today/i })).not.toBeInTheDocument();
  });
});
