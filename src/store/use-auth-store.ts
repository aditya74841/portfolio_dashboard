import { create } from "zustand";
import { apiFetch } from "@/lib/api";
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
  isAuthenticated: boolean;
  isPinVerified: boolean;
  pinExpiresAt: number | null; // timestamp ms
  isLoading: boolean;

  // Primary Auth
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (googleToken: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<boolean>;

  // PIN
  setPin: (pin: string, currentPin?: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<void>;
  checkPinSession: () => boolean;
  touchPinSession: () => Promise<void>;

  // Profile
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  changeAvatar: (file: File) => Promise<void>;
  removeAvatar: () => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
      user: null,
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
          const data = await apiFetch<{ user: User }>("/auth/email-login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
          });

          set({
            user: data.user,
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
          const data = await apiFetch<{ user: User }>("/auth/google", {
            method: "POST",
            body: JSON.stringify({ token: googleToken }),
          });

          set({
            user: data.user,
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
          const data = await apiFetch<{ user: User }>("/auth/register", {
            method: "POST",
            body: JSON.stringify({ name, email, password }),
          });

          set({
            user: data.user,
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
      logout: async () => {
        // Clear server session and HTTP-only cookie through the proxy.
        await apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
        set({
          user: null,
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
        try {
          const user = await apiFetch<User>("/auth/me");
          let isPinVerified = false;
          let pinExpiresAt: number | null = null;
          try {
            const pinSession = await apiFetch<{ isValid: boolean; pinSessionExpiresAt: string | null }>("/auth/pin-session");
            if (pinSession.isValid && pinSession.pinSessionExpiresAt) {
              const expiry = new Date(pinSession.pinSessionExpiresAt).getTime();
              if (Number.isFinite(expiry) && expiry > Date.now()) {
                isPinVerified = true;
                pinExpiresAt = expiry;
              }
            }
          } catch {
            // Keep a valid login, but require PIN again if unlock status cannot be checked.
          }
          set({ user, isAuthenticated: true, isPinVerified, pinExpiresAt });
          return true;
        } catch {
          set({ user: null, isAuthenticated: false, isPinVerified: false, pinExpiresAt: null });
          return false;
        }
      },

      // -----------------------------------------------------------------------
      // Set PIN
      // -----------------------------------------------------------------------
      setPin: async (pin: string, currentPin?: string) => {
        set({ isLoading: true });
        try {
          await apiFetch("/auth/set-pin", {
            method: "POST",
            body: JSON.stringify({ pin, ...(currentPin ? { currentPin } : {}) }),
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
          const data = await apiFetch<{ pinSessionExpiresAt: string }>("/auth/verify-pin", { method: "POST", body: JSON.stringify({ pin }) });
          set({ isPinVerified: true, pinExpiresAt: new Date(data.pinSessionExpiresAt).getTime(), isLoading: false });
          toast.success("PIN verified.");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Invalid PIN";
          if (message.startsWith("Not authorized")) {
            set({ user: null, isAuthenticated: false, isPinVerified: false, pinExpiresAt: null, isLoading: false });
            toast.error("Your login session expired. Sign in again.");
          } else {
            set({ isLoading: false });
            toast.error(message);
          }
          throw error;
        }
      },

      // -----------------------------------------------------------------------
      // Check PIN Session (local)
      // -----------------------------------------------------------------------
      checkPinSession: () => {
        const state = get();
        if (!state.pinExpiresAt) return false;
        return Date.now() < state.pinExpiresAt;
      },

      // Renew the server-side unlock session while the user is active.
      touchPinSession: async () => {
        try {
          const data = await apiFetch<{ pinSessionExpiresAt: string }>("/auth/pin-session/touch", { method: "POST" });
          set({ pinExpiresAt: new Date(data.pinSessionExpiresAt).getTime(), isPinVerified: true });
        } catch (error) {
          set({ isPinVerified: false, pinExpiresAt: null });
          throw error;
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
          const result = await apiFetch<{ avatar: string }>("/auth/avatar", { method: "PUT", body: formData });

          set((prev) => ({
            isLoading: false,
            user: prev.user ? { ...prev.user, avatar: result.avatar } : null,
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
          await apiFetch("/auth/change-password", { method: "PUT", body: JSON.stringify({ currentPassword, newPassword }) });
          set({ user: null, isAuthenticated: false, isPinVerified: false, pinExpiresAt: null, isLoading: false });
          toast.success("Password changed. Sign in again with your new password.");
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
    }));
