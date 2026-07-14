import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PinUnlockScreen } from '../pin-unlock-screen';
import { useAuthStore } from '@/store/use-auth-store';

describe('PinUnlockScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    useAuthStore.setState({
      isLoading: false,
      user: { name: 'Aditya' } as any, // No avatar to test default lock icon
      verifyPin: vi.fn(),
    });

    render(<PinUnlockScreen />);
    
    expect(screen.getByText('Security Check')).toBeInTheDocument();
    expect(screen.getByText('Enter your 4-digit PIN to access your workspace.')).toBeInTheDocument();
  });

  it('renders expired state correctly', () => {
    useAuthStore.setState({
      isLoading: false,
      user: null,
      verifyPin: vi.fn(),
    });

    render(<PinUnlockScreen expired={true} />);
    
    expect(screen.getByText('Session Expired')).toBeInTheDocument();
    expect(screen.getByText('Your 1-hour session has expired. Re-enter PIN.')).toBeInTheDocument();
  });

  it('calls verifyPin when 4 digits are entered', async () => {
    const verifyPinMock = vi.fn().mockResolvedValue(undefined);
    useAuthStore.setState({
      isLoading: false,
      user: null,
      verifyPin: verifyPinMock,
    });

    render(<PinUnlockScreen />);
    
    // Type 4321
    fireEvent.click(screen.getByText('4'));
    fireEvent.click(screen.getByText('3'));
    fireEvent.click(screen.getByText('2'));
    fireEvent.click(screen.getByText('1'));

    await waitFor(() => {
      expect(verifyPinMock).toHaveBeenCalledWith('4321');
    });
  });

  it('allows keyboard input', async () => {
    const verifyPinMock = vi.fn().mockResolvedValue(undefined);
    useAuthStore.setState({
      isLoading: false,
      user: null,
      verifyPin: verifyPinMock,
    });

    render(<PinUnlockScreen />);
    
    // Type 9876 using keyboard events
    fireEvent.keyDown(window, { key: '9' });
    fireEvent.keyDown(window, { key: '8' });
    fireEvent.keyDown(window, { key: '7' });
    fireEvent.keyDown(window, { key: '6' });

    await waitFor(() => {
      expect(verifyPinMock).toHaveBeenCalledWith('9876');
    });
  });

  it('disables buttons when loading', () => {
    useAuthStore.setState({
      isLoading: true, // Should disable input
      user: null,
      verifyPin: vi.fn(),
    });

    render(<PinUnlockScreen />);
    
    const button = screen.getByText('1') as HTMLButtonElement;
    expect(button).toBeDisabled();
  });
});
