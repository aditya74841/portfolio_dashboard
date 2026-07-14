import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '../use-auth-store';
import { apiFetch } from '@/lib/api';

// Mock the API module
vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
  API_BASE_URL: 'http://localhost:8080/api/v1',
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store state and clear mocks before each test
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isPinVerified: false,
      pinExpiresAt: null,
      isLoading: false,
    });
    vi.clearAllMocks();
  });

  describe('loginWithEmail', () => {
    it('should update state correctly on successful login', async () => {
      const mockUser = {
        _id: '1',
        name: 'Test User',
        email: 'test@example.com',
        avatar: '',
        role: 'user',
        authProvider: 'email',
        hasPin: true,
        pinSessionExpiresAt: null,
      };
      
      const mockResponse = { user: mockUser, token: 'mock-jwt-token' };
      
      // Mock the successful api call
      vi.mocked(apiFetch).mockResolvedValue(mockResponse);

      const store = useAuthStore.getState();
      await store.loginWithEmail('test@example.com', 'password123');

      const newState = useAuthStore.getState();
      expect(apiFetch).toHaveBeenCalledWith('/auth/email-login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      });
      expect(newState.isAuthenticated).toBe(true);
      expect(newState.user).toEqual(mockUser);
      expect(newState.token).toBe('mock-jwt-token');
      expect(newState.isLoading).toBe(false);
    });

    it('should set isLoading to false and throw error on failed login', async () => {
      const error = new Error('Invalid credentials');
      vi.mocked(apiFetch).mockRejectedValue(error);

      const store = useAuthStore.getState();
      
      await expect(store.loginWithEmail('test@example.com', 'wrongpassword')).rejects.toThrow('Invalid credentials');
      
      const newState = useAuthStore.getState();
      expect(newState.isAuthenticated).toBe(false);
      expect(newState.isLoading).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear user state', () => {
      // Setup authenticated state
      useAuthStore.setState({
        user: { _id: '1', name: 'Test' } as any,
        token: 'token',
        isAuthenticated: true,
        isPinVerified: true,
        pinExpiresAt: Date.now() + 10000,
      });

      // Mock logout api call
      vi.mocked(apiFetch).mockResolvedValue({});

      const store = useAuthStore.getState();
      store.logout();

      const newState = useAuthStore.getState();
      expect(newState.user).toBeNull();
      expect(newState.token).toBeNull();
      expect(newState.isAuthenticated).toBe(false);
      expect(newState.isPinVerified).toBe(false);
      expect(newState.pinExpiresAt).toBeNull();
    });
  });

  describe('PIN verification', () => {
    it('should verify PIN and set expiration correctly', async () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString();
      vi.mocked(apiFetch).mockResolvedValue({ pinSessionExpiresAt: futureDate });

      const store = useAuthStore.getState();
      await store.verifyPin('1234');

      const newState = useAuthStore.getState();
      expect(newState.isPinVerified).toBe(true);
      expect(newState.pinExpiresAt).toBe(new Date(futureDate).getTime());
      expect(newState.isLoading).toBe(false);
    });
  });
});
