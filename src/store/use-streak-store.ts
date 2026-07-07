import { create } from "zustand";
import { apiFetch } from "@/lib/api";

interface StreakLog {
  value: number;
  completed: boolean;
  completedAt?: Date;
  note?: string;
}

interface Streak {
  _id: string;
  name: string;
  description: string;
  streakNumber: StreakLog[];
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate?: Date;
  isActive: boolean;
  completionRate?: number;
}

interface StreakState {
  streaks: Streak[];
  isLoading: boolean;
  error: string | null;
  fetchStreaks: () => Promise<void>;
  createStreak: (name: string, description: string) => Promise<void>;
  markStreakComplete: (id: string, streakValue: number, note?: string) => Promise<void>;
  deleteStreak: (id: string) => Promise<void>;
}

export const useStreakStore = create<StreakState>((set) => ({
  streaks: [],
  isLoading: false,
  error: null,

  fetchStreaks: async () => {
    set({ isLoading: true, error: null });
    try {
      const data: any = await apiFetch("/streak");
      set({ streaks: data.docs || data, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.message || "Failed to fetch streaks", 
        isLoading: false 
      });
    }
  },

  createStreak: async (name, description) => {
    set({ isLoading: true, error: null });
    try {
      await apiFetch("/streak", {
        method: "POST",
        body: JSON.stringify({ name, description }),
      });
      // Refresh list
      const data: any = await apiFetch("/streak");
      set({ streaks: data.docs || data, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.message || "Failed to create streak", 
        isLoading: false 
      });
      throw error;
    }
  },

  markStreakComplete: async (id, streakValue, note) => {
    set({ isLoading: true, error: null });
    try {
      await apiFetch(`/streak/${id}/complete`, {
        method: "POST",
        body: JSON.stringify({ streakValue, note }),
      });
      // Refresh list
      const data: any = await apiFetch("/streak");
      set({ streaks: data.docs || data, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.message || "Failed to mark streak complete", 
        isLoading: false 
      });
      throw error;
    }
  },

  deleteStreak: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiFetch(`/streak/${id}`, {
        method: "DELETE",
      });
      set((state) => ({
        streaks: state.streaks.filter((s) => s._id !== id),
        isLoading: false
      }));
    } catch (error: any) {
      set({ 
        error: error.message || "Failed to delete streak", 
        isLoading: false 
      });
      throw error;
    }
  },
}));
