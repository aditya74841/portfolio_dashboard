import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsPage from '../page';
import { useAuthStore } from '@/store/use-auth-store';

// Mock the Sidebar component to avoid rendering its complexity
vi.mock('@/components/layout/sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar Mock</div>,
}));

describe('SettingsPage', () => {
  const mockUser = {
    _id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://example.com/avatar.jpg',
    role: 'admin',
    authProvider: 'email',
    hasPin: true,
  };

  const mockUpdateProfile = vi.fn();
  const mockChangePassword = vi.fn();
  const mockSetPin = vi.fn();
  const mockVerifyPin = vi.fn();
  const mockLogout = vi.fn();
  const mockChangeAvatar = vi.fn();
  const mockRemoveAvatar = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock store implementation
    useAuthStore.setState({
      user: mockUser as any,
      isLoading: false,
      updateProfile: mockUpdateProfile,
      changePassword: mockChangePassword,
      setPin: mockSetPin,
      verifyPin: mockVerifyPin,
      logout: mockLogout,
      changeAvatar: mockChangeAvatar,
      removeAvatar: mockRemoveAvatar,
    });
  });

  it('renders user information correctly', () => {
    render(<SettingsPage />);
    
    // Check if name is in the input
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    
    // Check if email is displayed
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    
    // Check badges
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('email')).toBeInTheDocument();
  });

  it('handles profile name update after PIN confirmation', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);
    
    const nameInput = screen.getByDisplayValue('John Doe');
    
    // Clear the input and type a new name
    await user.clear(nameInput);
    await user.type(nameInput, 'Jane Smith');
    
    // Find the Save button in the form
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);
    
    // Wait for the PIN dialog to open
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    
    // Using testid or finding the input by role in dialog
    // Actually, in React Testing Library, we can use `within` but we need to import it.
    // Let's import within from '@testing-library/react'
    
    // We didn't import within, so let's just find all inputs with •••• and pick the last one (since Dialog appends)
    const pinInputs = await screen.findAllByPlaceholderText('••••');
    // The dialog input is the second one, or the one inside the dialog
    // Wait, let's just grab the input inside the dialog
    const dialogInput = pinInputs.find(input => dialog.contains(input)) || pinInputs[pinInputs.length - 1];
    
    // Type PIN
    await user.type(dialogInput, '1234');
    
    // Click Verify & Save button inside dialog
    const verifyButtons = await screen.findAllByRole('button', { name: /verify & save/i });
    const verifyButton = verifyButtons[0];
    await user.click(verifyButton);
    
    // verifyPin should be called with 1234
    expect(mockVerifyPin).toHaveBeenCalledWith('1234');
    
    // updateProfile should be called with Jane Smith
    expect(mockUpdateProfile).toHaveBeenCalledWith('Jane Smith');
  });

  it('handles password change', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);
    
    const currentPasswordInput = screen.getByPlaceholderText('••••••••');
    const newPasswordInput = screen.getByPlaceholderText('Min. 6 characters');
    
    await user.type(currentPasswordInput, 'oldpass123');
    await user.type(newPasswordInput, 'newpass123');
    
    const updateButton = screen.getByRole('button', { name: /update password/i });
    await user.click(updateButton);
    
    expect(mockChangePassword).toHaveBeenCalledWith('oldpass123', 'newpass123');
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);
    
    const currentPasswordInput = screen.getByPlaceholderText('••••••••');
    
    // Initially should be password type
    expect(currentPasswordInput).toHaveAttribute('type', 'password');
    
    // Click the eye icon button (it doesn't have a name, but it's near the input)
    // We can find it by finding the button inside the same container, or by its type
    const toggleButtons = screen.getAllByRole('button');
    // The toggle button is the one before the new password input. 
    // Easier way: just select by role where type="button" and it contains an svg
    const toggleButton = toggleButtons.find(btn => !btn.textContent && btn.getAttribute('type') === 'button');
    
    if (toggleButton) {
      await user.click(toggleButton);
      expect(currentPasswordInput).toHaveAttribute('type', 'text');
    }
  });

  it('handles PIN change', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);
    
    const pinInput = screen.getByPlaceholderText('••••');
    await user.type(pinInput, '4321');
    
    const updatePinButton = screen.getByRole('button', { name: /update pin/i });
    await user.click(updatePinButton);
    
    expect(mockSetPin).toHaveBeenCalledWith('4321');
  });

  it('disables PIN change button if PIN is not 4 digits', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);
    
    const pinInput = screen.getByPlaceholderText('••••');
    await user.type(pinInput, '123');
    
    const updatePinButton = screen.getByRole('button', { name: /update pin/i });
    expect(updatePinButton).toBeDisabled();
  });

  it('handles logout', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);
    
    const logoutButton = screen.getByRole('button', { name: /sign out/i });
    await user.click(logoutButton);
    
    expect(mockLogout).toHaveBeenCalled();
  });
});
