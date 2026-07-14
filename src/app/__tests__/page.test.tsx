import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from '../page';
import { useAuthStore } from '@/store/use-auth-store';
import { useIdeaStore } from '@/store/use-idea-store';

vi.mock('@/components/layout/sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar Mock</div>,
}));

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode, href: string }) => (
    <a href={href} data-testid={`link-${href}`}>
      {children}
    </a>
  ),
}));

describe('Main Dashboard (Home)', () => {
  const mockIdea = {
    _id: '1',
    title: 'Dashboard App',
    description: 'A great app',
    status: 'building',
    updates: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockFetchIdeas = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    useAuthStore.setState({
      isAuthenticated: true,
      user: { name: 'Aditya' }
    } as any);
    
    useIdeaStore.setState({
      ideas: [mockIdea] as any,
      fetchIdeas: mockFetchIdeas,
      isLoading: false,
    } as any);
  });

  it('renders correctly and fetches ideas on mount if authenticated', () => {
    render(<Home />);
    
    expect(mockFetchIdeas).toHaveBeenCalled();
    expect(screen.getByText('Welcome back, Aditya. Build something great today.')).toBeInTheDocument();
    
    // Check StatCards
    expect(screen.getByText('Active Ideas')).toBeInTheDocument();
    expect(screen.getByText('Updates Logged')).toBeInTheDocument();
    expect(screen.getByText('Current Streak')).toBeInTheDocument();
    
    // Check Recent Ideas
    expect(screen.getByText('Dashboard App')).toBeInTheDocument();
  });

  it('displays default greeting if user name is missing', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: null
    } as any);
    
    render(<Home />);
    
    expect(screen.getByText('Welcome back, Chief. Build something great today.')).toBeInTheDocument();
  });

  it('does not fetch ideas if not authenticated', () => {
    useAuthStore.setState({
      isAuthenticated: false,
    } as any);
    
    render(<Home />);
    
    expect(mockFetchIdeas).not.toHaveBeenCalled();
  });

  it('displays empty state for recent ideas', () => {
    useIdeaStore.setState({
      ideas: []
    } as any);
    
    render(<Home />);
    
    expect(screen.getByText('No ideas captured yet.')).toBeInTheDocument();
  });
});
