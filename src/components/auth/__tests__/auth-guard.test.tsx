import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthGuard } from '../auth-guard';
import { useAuthStore } from '@/store/use-auth-store';

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/',
}));

// Mock the screens so we can verify they render without needing all their dependencies
vi.mock('../pin-setup-screen', () => ({
  PinSetupScreen: () => <div data-testid="pin-setup-screen">Pin Setup Screen</div>,
}));

vi.mock('../pin-unlock-screen', () => ({
  PinUnlockScreen: () => <div data-testid="pin-unlock-screen">Pin Unlock Screen</div>,
}));

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: null,
    });
    
    // Partially mock checkSession so it doesn't resolve immediately
    const checkSessionMock = vi.fn().mockImplementation(() => new Promise(() => {}));
    const checkPinSessionFromServerMock = vi.fn();
    
    useAuthStore.setState({
      checkSession: checkSessionMock,
      checkPinSessionFromServer: checkPinSessionFromServerMock,
    });

    render(<AuthGuard><div>Protected Content</div></AuthGuard>);
    
    expect(screen.getByText('Loading workspace...')).toBeInTheDocument();
  });

  it('renders children when fully authenticated and PIN verified', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: { _id: '1', hasPin: true } as any,
      isPinVerified: true,
      checkSession: vi.fn().mockResolvedValue(undefined),
      checkPinSessionFromServer: vi.fn().mockResolvedValue({ hasPin: true, isValid: true }),
      checkPinSession: vi.fn().mockReturnValue(true), // local check passes
    });

    render(<AuthGuard><div data-testid="protected-content">Protected Content</div></AuthGuard>);
    
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  it('renders PinSetupScreen if user has no PIN', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: { _id: '1', hasPin: false } as any,
      checkSession: vi.fn().mockResolvedValue(undefined),
      checkPinSessionFromServer: vi.fn().mockResolvedValue({ hasPin: false, isValid: false }),
    });

    render(<AuthGuard><div>Protected Content</div></AuthGuard>);
    
    await waitFor(() => {
      expect(screen.getByTestId('pin-setup-screen')).toBeInTheDocument();
    });
  });

  it('renders PinUnlockScreen if PIN session is expired/invalid', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: { _id: '1', hasPin: true } as any,
      isPinVerified: false,
      checkSession: vi.fn().mockResolvedValue(undefined),
      checkPinSessionFromServer: vi.fn().mockResolvedValue({ hasPin: true, isValid: false }),
      checkPinSession: vi.fn().mockReturnValue(false),
    });

    render(<AuthGuard><div>Protected Content</div></AuthGuard>);
    
    await waitFor(() => {
      expect(screen.getByTestId('pin-unlock-screen')).toBeInTheDocument();
    });
  });
});
