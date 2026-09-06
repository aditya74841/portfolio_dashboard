import { create } from "zustand";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

export interface DiaryEntry {
  _id: string;
  userId: string;
  date: string; // Format: YYYY-MM-DD
  content: string;
  mood: string;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

// Helper to get formatted YYYY-MM-DD string
export const getTodayDateString = (d = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper to shift a date by N days
export const shiftDateString = (dateStr: string, days: number): string => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return getTodayDateString(date);
};

interface DiaryState {
  entries: DiaryEntry[];
  activeEntry: DiaryEntry | null;
  selectedDate: string; // YYYY-MM-DD
  isLoading: boolean;
  isSaving: boolean;

  fetchTodayEntry: () => Promise<DiaryEntry | null>;
  fetchEntryByDate: (dateStr: string) => Promise<DiaryEntry | null>;
  fetchEntries: () => Promise<void>;
  saveEntry: (dateStr: string, content: string, mood?: string) => Promise<DiaryEntry | null>;
  deleteEntry: (id: string) => Promise<void>;
  setSelectedDate: (dateStr: string) => void;
  setActiveEntry: (entry: DiaryEntry | null) => void;
}

export const useDiaryStore = create<DiaryState>((set, get) => ({
  entries: [],
  activeEntry: null,
  selectedDate: getTodayDateString(),
  isLoading: false,
  isSaving: false,

  fetchTodayEntry: async () => {
    const todayStr = getTodayDateString();
    set({ isLoading: true, selectedDate: todayStr });
    try {
      const entry = await apiFetch<DiaryEntry>("/diary/today");
      if (entry) {
        set((state) => ({
          activeEntry: entry,
          isLoading: false,
          entries: state.entries.some((e) => e._id === entry._id)
            ? state.entries.map((e) => (e._id === entry._id ? entry : e))
            : [entry, ...state.entries],
        }));
      } else {
        set({ isLoading: false });
      }
      return entry;
    } catch (error) {
      set({ isLoading: false });
      toast.error("Failed to load today's diary page.");
      return null;
    }
  },

  fetchEntryByDate: async (dateStr: string) => {
    set({ isLoading: true, selectedDate: dateStr });
    try {
      const entry = await apiFetch<DiaryEntry>(`/diary/date/${dateStr}`);
      if (entry) {
        set((state) => ({
          activeEntry: entry,
          isLoading: false,
          entries: state.entries.some((e) => e._id === entry._id)
            ? state.entries.map((e) => (e._id === entry._id ? entry : e))
            : [entry, ...state.entries],
        }));
      } else {
        set({ isLoading: false });
      }
      return entry;
    } catch (error) {
      set({ isLoading: false });
      toast.error(`Failed to load diary entry for ${dateStr}.`);
      return null;
    }
  },

  fetchEntries: async () => {
    set({ isLoading: true });
    try {
      const entries = await apiFetch<DiaryEntry[]>("/diary");
      set({ entries: entries || [], isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      toast.error("Failed to load diary archive.");
    }
  },

  saveEntry: async (dateStr: string, content: string, mood = "Neutral") => {
    set({ isSaving: true });
    try {
      const savedEntry = await apiFetch<DiaryEntry>("/diary", {
        method: "POST",
        body: JSON.stringify({ date: dateStr, content, mood }),
      });

      if (savedEntry) {
        set((state) => {
          const exists = state.entries.some((e) => e._id === savedEntry._id || e.date === savedEntry.date);
          const updatedEntries = exists
            ? state.entries.map((e) => (e._id === savedEntry._id || e.date === savedEntry.date ? savedEntry : e))
            : [savedEntry, ...state.entries];

          return {
            activeEntry: savedEntry,
            entries: updatedEntries,
            isSaving: false,
          };
        });
      } else {
        set({ isSaving: false });
      }
      return savedEntry;
    } catch (error) {
      set({ isSaving: false });
      toast.error("Failed to save diary page.");
      return null;
    }
  },

  deleteEntry: async (id: string) => {
    const previousEntries = get().entries;
    const previousActive = get().activeEntry;

    // Optimistic deletion
    set((state) => ({
      entries: state.entries.filter((e) => e._id !== id),
      activeEntry: state.activeEntry?._id === id ? null : state.activeEntry,
    }));

    try {
      await apiFetch(`/diary/${id}`, { method: "DELETE" });
      toast.success("Diary entry deleted.");
    } catch (error) {
      // Rollback on error
      set({ entries: previousEntries, activeEntry: previousActive });
      toast.error("Failed to delete diary entry.");
    }
  },

  setSelectedDate: (dateStr: string) => set({ selectedDate: dateStr }),
  setActiveEntry: (entry: DiaryEntry | null) => set({ activeEntry: entry }),
}));
