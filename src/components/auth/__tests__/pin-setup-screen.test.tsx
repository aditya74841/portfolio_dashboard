import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PinSetupScreen } from '../pin-setup-screen';
import { useAuthStore } from '@/store/use-auth-store';

describe('PinSetupScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly on initial load', () => {
    useAuthStore.setState({
      isLoading: false,
      setPin: vi.fn(),
    });

    render(<PinSetupScreen />);
    
    expect(screen.getByText('Set Your PIN')).toBeInTheDocument();
    expect(screen.getByText('Choose a 4-digit PIN for quick access.')).toBeInTheDocument();
    
    // Check that numpad buttons 0-9 and Clear are rendered
    for (let i = 0; i <= 9; i++) {
      expect(screen.getByText(i.toString())).toBeInTheDocument();
    }
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('allows entering a 4-digit PIN and proceeds to confirm step', async () => {
    useAuthStore.setState({
      isLoading: false,
      setPin: vi.fn(),
    });

    render(<PinSetupScreen />);
    
    // Click 1, 2, 3, 4
    fireEvent.click(screen.getByText('1'));
    fireEvent.click(screen.getByText('2'));
    fireEvent.click(screen.getByText('3'));
    fireEvent.click(screen.getByText('4'));

    // It should automatically switch to Confirm step
    expect(screen.getByText('Confirm PIN')).toBeInTheDocument();
    expect(screen.getByText('Re-enter your PIN to confirm.')).toBeInTheDocument();
  });

  it('calls setPin when confirmation matches', async () => {
    const setPinMock = vi.fn().mockResolvedValue(undefined);
    useAuthStore.setState({
      isLoading: false,
      setPin: setPinMock,
    });

    render(<PinSetupScreen />);
    
    // Step 1: Create
    fireEvent.click(screen.getByText('1'));
    fireEvent.click(screen.getByText('2'));
    fireEvent.click(screen.getByText('3'));
    fireEvent.click(screen.getByText('4'));

    // Step 2: Confirm
    fireEvent.click(screen.getByText('1'));
    fireEvent.click(screen.getByText('2'));
    fireEvent.click(screen.getByText('3'));
    fireEvent.click(screen.getByText('4'));

    // Should call API
    expect(setPinMock).toHaveBeenCalledWith('1234');
  });

  it('resets to create step if confirmation fails', async () => {
    useAuthStore.setState({
      isLoading: false,
      setPin: vi.fn(),
    });

    render(<PinSetupScreen />);
    
    // Step 1: Create (1234)
    fireEvent.click(screen.getByText('1'));
    fireEvent.click(screen.getByText('2'));
    fireEvent.click(screen.getByText('3'));
    fireEvent.click(screen.getByText('4'));

    // Step 2: Confirm wrong (1235)
    fireEvent.click(screen.getByText('1'));
    fireEvent.click(screen.getByText('2'));
    fireEvent.click(screen.getByText('3'));
    fireEvent.click(screen.getByText('5'));

    // Should reset to Create step
    expect(screen.getByText('Set Your PIN')).toBeInTheDocument();
  });

  it('handles Clear button properly', () => {
    useAuthStore.setState({
      isLoading: false,
      setPin: vi.fn(),
    });

    render(<PinSetupScreen />);
    
    fireEvent.click(screen.getByText('1'));
    fireEvent.click(screen.getByText('2'));
    fireEvent.click(screen.getByText('Clear'));

    // If we click 3 more times, we should NOT advance to confirm because we cleared 1 digit (so length is 4 after 3 more clicks)
    fireEvent.click(screen.getByText('3'));
    fireEvent.click(screen.getByText('4'));
    fireEvent.click(screen.getByText('5'));

    // Now it should be 4 digits and go to confirm
    expect(screen.getByText('Confirm PIN')).toBeInTheDocument();
  });
});
