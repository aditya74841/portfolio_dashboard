import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { apiFetch, API_BASE_URL } from "@/lib/api";
import { toast } from "sonner";

interface User {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  authProvider: string;
  hasPin: boolean;
  pinSessionExpiresAt: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isPinVerified: boolean;
  pinExpiresAt: number | null; // timestamp ms
  isLoading: boolean;

  // Primary Auth
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (googleToken: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  checkSession: () => Promise<void>;

  // PIN
  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<void>;
  checkPinSession: () => boolean;
  checkPinSessionFromServer: () => Promise<{ hasPin: boolean; isValid: boolean }>;

  // Profile
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  changeAvatar: (file: File) => Promise<void>;
  removeAvatar: () => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isPinVerified: false,
      pinExpiresAt: null,
      isLoading: false,

      // -----------------------------------------------------------------------
      // Email Login
      // -----------------------------------------------------------------------
      loginWithEmail: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const data = await apiFetch<{ user: User; token: string }>("/auth/email-login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
          });

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isPinVerified: false,
            pinExpiresAt: null,
            isLoading: false,
          });

          toast.success("Welcome back!");
        } catch (error) {
          set({ isLoading: false });
          const message = error instanceof Error ? error.message : "Login failed";
          toast.error(message);
          throw error;
        }
      },

      // -----------------------------------------------------------------------
      // Google Login
      // -----------------------------------------------------------------------
      loginWithGoogle: async (googleToken: string) => {
        set({ isLoading: true });
        try {
          const data = await apiFetch<{ user: User; token: string }>("/auth/google", {
            method: "POST",
            body: JSON.stringify({ token: googleToken }),
          });

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isPinVerified: false,
            pinExpiresAt: null,
            isLoading: false,
          });

          toast.success("Welcome back!");
        } catch (error) {
          set({ isLoading: false });
          const message = error instanceof Error ? error.message : "Google login failed";
          toast.error(message);
          throw error;
        }
      },

      // -----------------------------------------------------------------------
      // Register
      // -----------------------------------------------------------------------
      register: async (name: string, email: string, password: string) => {
        set({ isLoading: true });
        try {
          const data = await apiFetch<{ user: User; token: string }>("/auth/register", {
            method: "POST",
            body: JSON.stringify({ name, email, password }),
          });

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isPinVerified: false,
            pinExpiresAt: null,
            isLoading: false,
          });

          toast.success("Account created successfully!");
        } catch (error) {
          set({ isLoading: false });
          const message = error instanceof Error ? error.message : "Registration failed";
          toast.error(message);
          throw error;
        }
      },

      // -----------------------------------------------------------------------
      // Logout
      // -----------------------------------------------------------------------
      logout: () => {
        // Fire and forget server logout
        apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isPinVerified: false,
          pinExpiresAt: null,
        });
        toast.info("Logged out.");
      },

      // -----------------------------------------------------------------------
      // Check Session (on page load)
      // -----------------------------------------------------------------------
      checkSession: async () => {
        const state = get();
        if (!state.token) return;

        try {
          const user = await apiFetch<User>("/auth/me");
          set({ user, isAuthenticated: true });
        } catch {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isPinVerified: false,
            pinExpiresAt: null,
          });
        }
      },

      // -----------------------------------------------------------------------
      // Set PIN
      // -----------------------------------------------------------------------
      setPin: async (pin: string) => {
        set({ isLoading: true });
        try {
          await apiFetch("/auth/set-pin", {
            method: "POST",
            body: JSON.stringify({ pin }),
          });

          // After setting PIN, also verify it to start a session
          const data = await apiFetch<{ pinSessionExpiresAt: string }>("/auth/verify-pin", {
            method: "POST",
            body: JSON.stringify({ pin }),
          });

          const expiresAt = new Date(data.pinSessionExpiresAt).getTime();

          set((prev) => ({
            isLoading: false,
            isPinVerified: true,
            pinExpiresAt: expiresAt,
            user: prev.user ? { ...prev.user, hasPin: true } : null,
          }));

          toast.success("PIN set successfully!");
        } catch (error) {
          set({ isLoading: false });
          const message = error instanceof Error ? error.message : "Failed to set PIN";
          toast.error(message);
          throw error;
        }
      },

      // -----------------------------------------------------------------------
      // Verify PIN
      // -----------------------------------------------------------------------
      verifyPin: async (pin: string) => {
        set({ isLoading: true });
        try {
          const data = await apiFetch<{ pinSessionExpiresAt: string }>("/auth/verify-pin", {
            method: "POST",
            body: JSON.stringify({ pin }),
          });

          const expiresAt = new Date(data.pinSessionExpiresAt).getTime();

          set({
            isPinVerified: true,
            pinExpiresAt: expiresAt,
            isLoading: false,
          });

          toast.success("Welcome back, Chief.");
        } catch (error) {
          set({ isLoading: false });
          const message = error instanceof Error ? error.message : "Invalid PIN";
          toast.error(message);
          throw error;
        }
      },

      // -----------------------------------------------------------------------
      // Check PIN Session (local)
      // -----------------------------------------------------------------------
      checkPinSession: () => {
        const state = get();
        if (!state.pinExpiresAt) return false;
        const isValid = Date.now() < state.pinExpiresAt;
        if (!isValid && state.isPinVerified) {
          set({ isPinVerified: false });
        }
        return isValid;
      },

      // -----------------------------------------------------------------------
      // Check PIN Session (server)
      // -----------------------------------------------------------------------
      checkPinSessionFromServer: async () => {
        try {
          const data = await apiFetch<{ hasPin: boolean; isValid: boolean; pinSessionExpiresAt: string | null }>(
            "/auth/pin-session"
          );

          if (data.isValid && data.pinSessionExpiresAt) {
            const expiresAt = new Date(data.pinSessionExpiresAt).getTime();
            set({ isPinVerified: true, pinExpiresAt: expiresAt });
          } else {
            set({ isPinVerified: false, pinExpiresAt: null });
          }

          return { hasPin: data.hasPin, isValid: data.isValid };
        } catch {
          return { hasPin: false, isValid: false };
        }
      },

      // -----------------------------------------------------------------------
      // Forgot Password
      // -----------------------------------------------------------------------
      forgotPassword: async (email: string) => {
        set({ isLoading: true });
        try {
          await apiFetch("/auth/forgot-password", {
            method: "POST",
            body: JSON.stringify({ email }),
          });
          set({ isLoading: false });
          toast.success("If an account exists, a reset link has been sent.");
        } catch (error) {
          set({ isLoading: false });
          const message = error instanceof Error ? error.message : "Failed to send reset email";
          toast.error(message);
          throw error;
        }
      },

      // -----------------------------------------------------------------------
      // Reset Password
      // -----------------------------------------------------------------------
      resetPassword: async (token: string, password: string) => {
        set({ isLoading: true });
        try {
          await apiFetch("/auth/reset-password", {
            method: "POST",
            body: JSON.stringify({ token, password }),
          });
          set({ isLoading: false });
          toast.success("Password reset successful! You can now login.");
        } catch (error) {
          set({ isLoading: false });
          const message = error instanceof Error ? error.message : "Failed to reset password";
          toast.error(message);
          throw error;
        }
      },

      // -----------------------------------------------------------------------
      // Change Avatar
      // -----------------------------------------------------------------------
      changeAvatar: async (file: File) => {
        set({ isLoading: true });
        try {
          const formData = new FormData();
          formData.append("avatar", file);

          // Use raw fetch for FormData (no Content-Type header — browser sets it)
          const authState = typeof window !== "undefined" ? localStorage.getItem("auth-storage") : null;
          const token = authState ? JSON.parse(authState).state?.token : null;

          const response = await fetch(`${API_BASE_URL}/auth/avatar`, {
            method: "PUT",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.message || "Failed to update avatar");
          }

          set((prev) => ({
            isLoading: false,
            user: prev.user ? { ...prev.user, avatar: result.data.avatar } : null,
          }));

          toast.success("Avatar updated!");
        } catch (error) {
          set({ isLoading: false });
          const message = error instanceof Error ? error.message : "Failed to update avatar";
          toast.error(message);
          throw error;
        }
      },

      // -----------------------------------------------------------------------
      // Remove Avatar
      // -----------------------------------------------------------------------
      removeAvatar: async () => {
        set({ isLoading: true });
        try {
          const result = await apiFetch<{ avatar: string }>("/auth/avatar", {
            method: "DELETE",
          });

          set((prev) => ({
            isLoading: false,
            user: prev.user ? { ...prev.user, avatar: result.avatar } : null,
          }));

          toast.success("Avatar removed!");
        } catch (error) {
          set({ isLoading: false });
          const message = error instanceof Error ? error.message : "Failed to remove avatar";
          toast.error(message);
          throw error;
        }
      },

      // -----------------------------------------------------------------------
      // Change Password
      // -----------------------------------------------------------------------
      changePassword: async (currentPassword: string, newPassword: string) => {
        set({ isLoading: true });
        try {
          await apiFetch("/auth/change-password", {
            method: "PUT",
            body: JSON.stringify({ currentPassword, newPassword }),
          });
          set({ isLoading: false });
          toast.success("Password changed successfully!");
        } catch (error) {
          set({ isLoading: false });
          const message = error instanceof Error ? error.message : "Failed to change password";
          toast.error(message);
          throw error;
        }
      },

      // -----------------------------------------------------------------------
      // Update Profile (Name)
      // -----------------------------------------------------------------------
      updateProfile: async (name: string) => {
        set({ isLoading: true });
        try {
          const data = await apiFetch<{ user: User }>("/auth/update-profile", {
            method: "PUT",
            body: JSON.stringify({ name }),
          });
          set({ user: data.user, isLoading: false });
          toast.success("Profile updated successfully");
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error.message || "Failed to update profile");
          throw error;
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        isPinVerified: state.isPinVerified,
        pinExpiresAt: state.pinExpiresAt,
      }),
    }
  )
);
