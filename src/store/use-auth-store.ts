import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface User {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (pin: string) => Promise<void>;
  logout: () => void;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (pin: string) => {
        set({ isLoading: true });
        try {
          const data = await apiFetch<{ user: User; token: string }>("/auth/pin-login", {
            method: "POST",
            body: JSON.stringify({ pin }),
          });

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          });
          
          toast.success("Welcome back, Chief.");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Invalid PIN";
          set({ isLoading: false });
          toast.error(message);
          throw error;
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        toast.info("Session locked.");
      },

      checkSession: async () => {
        // Option to verify token validity with backend if needed
        const state = useAuthStore.getState();
        if (state.token && !state.user) {
           try {
             const user = await apiFetch<User>("/auth/me");
             set({ user, isAuthenticated: true });
           } catch {
             set({ user: null, token: null, isAuthenticated: false });
           }
        }
      }
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
