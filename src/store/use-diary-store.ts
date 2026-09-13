import { create } from "zustand";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { db, LocalDiaryEntry } from "@/lib/db";

export interface DiaryEntry {
  _id?: string;
  userId?: string;
  date: string; // Format: YYYY-MM-DD
  content: string;
  mood: string;
  wordCount: number;
  createdAt?: string;
  updatedAt: string;
  syncStatus?: "synced" | "pending";
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

// Helper to compute plain text word count from HTML string
export const calculateWordCount = (html: string = ""): number => {
  if (!html) return 0;
  // Exclude reflection prompt template so prompt questions don't inflate user word count
  const withoutPrompts = html.replace(/<p><strong>💡 Reflection Prompt:<\/strong>.*?<\/p>/gi, " ");
  const plainText = withoutPrompts
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
  if (!plainText) return 0;
  return plainText.split(/\s+/).filter(Boolean).length;
};

export type SyncState = "synced" | "syncing" | "pending" | "offline";

interface DiaryState {
  entries: DiaryEntry[];
  activeEntry: DiaryEntry | null;
  selectedDate: string; // YYYY-MM-DD
  isLoading: boolean;
  isSaving: boolean;
  isSyncing: boolean;
  syncState: SyncState;
  pendingCount: number;

  fetchTodayEntry: () => Promise<DiaryEntry | null>;
  fetchEntryByDate: (dateStr: string) => Promise<DiaryEntry | null>;
  fetchEntries: () => Promise<void>;
  saveLocalEntry: (dateStr: string, content: string, mood?: string) => Promise<DiaryEntry>;
  saveEntry: (dateStr: string, content: string, mood?: string) => Promise<DiaryEntry | null>;
  syncCloud: () => Promise<number>;
  syncPendingEntries: () => Promise<void>;
  deleteEntry: (idOrDate: string) => Promise<void>;
  setSelectedDate: (dateStr: string) => void;
  setActiveEntry: (entry: DiaryEntry | null) => void;
  updatePendingCount: () => Promise<void>;
}

export const useDiaryStore = create<DiaryState>((set, get) => ({
  entries: [],
  activeEntry: null,
  selectedDate: getTodayDateString(),
  isLoading: false,
  isSaving: false,
  isSyncing: false,
  syncState: "synced",
  pendingCount: 0,

  updatePendingCount: async () => {
    if (typeof window !== "undefined") {
      try {
        const count = await db.diary.where("syncStatus").equals("pending").count();
        set({
          pendingCount: count,
          syncState: count > 0 ? (navigator.onLine ? "pending" : "offline") : "synced",
        });
      } catch {
        // Fallback
      }
    }
  },

  fetchTodayEntry: async () => {
    const todayStr = getTodayDateString();
    set({ selectedDate: todayStr });

    // 1. Instantly read from local IndexedDB (0ms)
    try {
      if (typeof window !== "undefined") {
        const localEntry = await db.diary.get(todayStr);
        if (localEntry) {
          set((state) => ({
            activeEntry: localEntry,
            isLoading: false,
            entries: state.entries.some((e) => e.date === todayStr)
              ? state.entries.map((e) => (e.date === todayStr ? localEntry : e))
              : [localEntry, ...state.entries],
          }));
        } else {
          // Initialize empty default in memory
          const defaultEntry: DiaryEntry = {
            date: todayStr,
            content: "",
            mood: "Neutral",
            wordCount: 0,
            updatedAt: new Date().toISOString(),
            syncStatus: "synced",
          };
          set({ activeEntry: defaultEntry, isLoading: false });
        }
      }
    } catch {
      // Fallback if IndexedDB is unavailable
    }

    get().updatePendingCount();

    // 2. Reconcile with MongoDB in the background
    try {
      const serverEntry = await apiFetch<DiaryEntry>(`/diary/today?date=${todayStr}`);
      if (serverEntry && typeof window !== "undefined") {
        const local = await db.diary.get(todayStr);

        // Only override local if local doesn't have unsynced pending changes
        if (!local || local.syncStatus !== "pending") {
          const mergedEntry: LocalDiaryEntry = {
            ...serverEntry,
            syncStatus: "synced",
            updatedAt: serverEntry.updatedAt || new Date().toISOString(),
          };
          await db.diary.put(mergedEntry);
          set((state) => ({
            activeEntry: state.selectedDate === todayStr ? mergedEntry : state.activeEntry,
            entries: state.entries.some((e) => e.date === todayStr)
              ? state.entries.map((e) => (e.date === todayStr ? mergedEntry : e))
              : [mergedEntry, ...state.entries],
          }));
        }
      }
      get().updatePendingCount();
      return serverEntry;
    } catch {
      return get().activeEntry;
    }
  },

  fetchEntryByDate: async (dateStr: string) => {
    // 1. Immediately read from IndexedDB or memory cache (0ms)
    let initialEntry: DiaryEntry | null = null;

    if (typeof window !== "undefined") {
      try {
        const local = await db.diary.get(dateStr);
        if (local) initialEntry = local;
      } catch {
        // Fallback
      }
    }

    if (!initialEntry) {
      initialEntry = get().entries.find((e) => e.date === dateStr) || {
        date: dateStr,
        content: "",
        mood: "Neutral",
        wordCount: 0,
        updatedAt: new Date().toISOString(),
        syncStatus: "synced",
      };
    }

    // Update activeEntry and selectedDate simultaneously to avoid any intermediate blank state
    set({ selectedDate: dateStr, activeEntry: initialEntry, isLoading: false });
    get().updatePendingCount();

    // 2. Fetch from MongoDB in background to ensure freshness
    try {
      const serverEntry = await apiFetch<DiaryEntry>(`/diary/date/${dateStr}`);
      if (serverEntry && typeof window !== "undefined") {
        const local = await db.diary.get(dateStr);
        if (!local || local.syncStatus !== "pending") {
          const merged: LocalDiaryEntry = {
            ...serverEntry,
            syncStatus: "synced",
            updatedAt: serverEntry.updatedAt || new Date().toISOString(),
          };
          await db.diary.put(merged);
          set((state) => ({
            activeEntry: state.selectedDate === dateStr ? merged : state.activeEntry,
            entries: state.entries.some((e) => e.date === dateStr)
              ? state.entries.map((e) => (e.date === dateStr ? merged : e))
              : [merged, ...state.entries],
          }));
        }
      }
      get().updatePendingCount();
      return serverEntry;
    } catch {
      return initialEntry;
    }
  },

  fetchEntries: async () => {
    // 1. Instantly populate from local IndexedDB (0ms)
    if (typeof window !== "undefined") {
      try {
        const localList = await db.diary.orderBy("date").reverse().toArray();
        if (localList && localList.length > 0) {
          set({ entries: localList, isLoading: false });
        }
      } catch {
        // Fallback
      }
    }

    get().updatePendingCount();

    // 2. Pull archive from MongoDB in background
    try {
      const serverEntries = await apiFetch<DiaryEntry[]>("/diary");
      if (serverEntries && typeof window !== "undefined") {
        for (const s of serverEntries) {
          const local = await db.diary.get(s.date);
          if (!local || (local.syncStatus === "synced" && new Date(s.updatedAt) >= new Date(local.updatedAt))) {
            await db.diary.put({
              ...s,
              syncStatus: "synced",
              updatedAt: s.updatedAt || new Date().toISOString(),
            });
          }
        }
        const updatedList = await db.diary.orderBy("date").reverse().toArray();
        set({ entries: updatedList, isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    } finally {
      get().updatePendingCount();
    }
  },

  // Save specifically to IndexedDB locally (0ms, marks pending sync)
  saveLocalEntry: async (dateStr: string, content: string, mood = "Neutral") => {
    set({ isSaving: true });
    const wordCount = calculateWordCount(content);
    const now = new Date().toISOString();

    let existingId: string | undefined = undefined;
    let existingCreated: string | undefined = undefined;

    if (typeof window !== "undefined") {
      try {
        const existing = await db.diary.get(dateStr);
        existingId = existing?._id;
        existingCreated = existing?.createdAt;
      } catch (err) {
        console.warn("IndexedDB read error:", err);
      }
    }

    if (!existingId) {
      const mem = get().entries.find((e) => e.date === dateStr) ||
        (get().activeEntry?.date === dateStr ? get().activeEntry : undefined);
      existingId = mem?._id;
      existingCreated = mem?.createdAt;
    }

    const localRecord: LocalDiaryEntry = {
      date: dateStr,
      _id: existingId,
      content,
      mood,
      wordCount,
      createdAt: existingCreated || now,
      updatedAt: now,
      syncStatus: "pending",
    };

    // Save to IndexedDB
    if (typeof window !== "undefined") {
      try {
        await db.diary.put(localRecord);
      } catch (err) {
        console.error("IndexedDB put error:", err);
      }
    }

    // Update Zustand state
    set((state) => {
      const exists = state.entries.some((e) => e.date === dateStr);
      const updatedEntries = exists
        ? state.entries.map((e) => (e.date === dateStr ? localRecord : e))
        : [localRecord, ...state.entries];

      return {
        activeEntry: localRecord,
        entries: updatedEntries,
        isSaving: false,
        syncState: typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "pending",
      };
    });

    await get().updatePendingCount();
    return localRecord;
  },

  // Full save (saves locally, then syncs to cloud)
  saveEntry: async (dateStr: string, content: string, mood = "Neutral") => {
    const localRecord = await get().saveLocalEntry(dateStr, content, mood);

    // If online, sync to cloud
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      set({ syncState: "offline" });
      return localRecord;
    }

    try {
      set({ isSyncing: true, syncState: "syncing" });
      const savedServer = await apiFetch<DiaryEntry>("/diary", {
        method: "POST",
        body: JSON.stringify({ date: dateStr, content, mood }),
      });

      if (savedServer && typeof window !== "undefined") {
        await db.diary.update(dateStr, {
          _id: savedServer._id,
          userId: savedServer.userId,
          syncStatus: "synced",
          updatedAt: savedServer.updatedAt || localRecord.updatedAt,
        });

        const syncedRecord: DiaryEntry = {
          ...localRecord,
          _id: savedServer._id,
          userId: savedServer.userId,
          syncStatus: "synced",
        };

        set((state) => ({
          activeEntry: state.activeEntry?.date === dateStr ? syncedRecord : state.activeEntry,
          entries: state.entries.map((e) => (e.date === dateStr ? syncedRecord : e)),
          isSyncing: false,
          syncState: "synced",
        }));

        await get().updatePendingCount();
        return syncedRecord;
      }
      return localRecord;
    } catch {
      set({ isSyncing: false });
      await get().updatePendingCount();
      return localRecord;
    }
  },

  // Explicit Cloud Sync Button Trigger
  syncCloud: async () => {
    if (typeof window === "undefined") return 0;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      toast.error("Cannot sync to cloud: You are currently offline.");
      set({ syncState: "offline" });
      return 0;
    }

    try {
      set({ isSyncing: true, syncState: "syncing" });
      const pendingList = await db.diary.where("syncStatus").equals("pending").toArray();

      if (!pendingList || pendingList.length === 0) {
        set({ isSyncing: false, syncState: "synced", pendingCount: 0 });
        toast.info("All diary notes are already synced with cloud!");
        return 0;
      }

      let successCount = 0;
      for (const entry of pendingList) {
        try {
          const res = await apiFetch<DiaryEntry>("/diary", {
            method: "POST",
            body: JSON.stringify({ date: entry.date, content: entry.content, mood: entry.mood }),
          });
          if (res) {
            await db.diary.update(entry.date, {
              _id: res._id,
              userId: res.userId,
              syncStatus: "synced",
            });
            successCount++;
          }
        } catch (err) {
          console.error(`Failed to sync entry for ${entry.date}:`, err);
        }
      }

      const refreshed = await db.diary.orderBy("date").reverse().toArray();
      const remainingCount = await db.diary.where("syncStatus").equals("pending").count();

      set({
        entries: refreshed,
        isSyncing: false,
        pendingCount: remainingCount,
        syncState: remainingCount === 0 ? "synced" : "pending",
      });

      if (successCount > 0) {
        toast.success(`Cloud sync complete! ${successCount} note(s) backed up to MongoDB.`);
      }

      return successCount;
    } catch (error) {
      set({ isSyncing: false });
      toast.error("Cloud sync encountered an error.");
      await get().updatePendingCount();
      return 0;
    }
  },

  syncPendingEntries: async () => {
    await get().syncCloud();
  },

  deleteEntry: async (idOrDate: string) => {
    const previousEntries = get().entries;
    const previousActive = get().activeEntry;

    // Find the entry by either _id or date
    const target = previousEntries.find((e) => e._id === idOrDate || e.date === idOrDate);
    const dateKey = target ? target.date : idOrDate;
    const mongoId = target?._id;

    // Optimistically remove from IndexedDB and memory state
    if (typeof window !== "undefined") {
      try {
        await db.diary.delete(dateKey);
      } catch {
        // Fallback
      }
    }

    set((state) => ({
      entries: state.entries.filter((e) => e.date !== dateKey),
      activeEntry: state.activeEntry?.date === dateKey ? null : state.activeEntry,
    }));

    await get().updatePendingCount();

    // Remove from MongoDB
    if (mongoId) {
      try {
        await apiFetch(`/diary/${mongoId}`, { method: "DELETE" });
        toast.success("Diary entry deleted.");
      } catch {
        // Rollback
        if (typeof window !== "undefined" && target) {
          await db.diary.put(target as LocalDiaryEntry);
        }
        set({ entries: previousEntries, activeEntry: previousActive });
        await get().updatePendingCount();
        toast.error("Failed to delete diary entry from cloud.");
      }
    } else {
      toast.success("Diary entry deleted.");
    }
  },

  setSelectedDate: (dateStr: string) => set({ selectedDate: dateStr }),
  setActiveEntry: (entry: DiaryEntry | null) => set({ activeEntry: entry }),
}));

// Initialize online event listener for auto-sync
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    useDiaryStore.getState().syncPendingEntries();
  });
}
