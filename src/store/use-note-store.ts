import { create } from "zustand";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

export interface Note {
  _id: string;
  title: string;
  content: string;
  category?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface NoteState {
  notes: Note[];
  activeNote: Note | null;
  isLoading: boolean;

  fetchNotes: () => Promise<void>;
  createNote: (title: string, content: string, category?: string) => Promise<Note | null>;
  updateNote: (id: string, title: string, content: string, category?: string) => Promise<void>;
  bulkUpdateCategory: (oldCategory: string, newCategory: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  setActiveNote: (note: Note | null) => void;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  activeNote: null,
  isLoading: false,

  fetchNotes: async () => {
    set({ isLoading: true });
    try {
      const notes = await apiFetch<Note[]>("/notes?limit=1000");
      set({ notes: notes || [], isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      toast.error("Failed to load notes.");
    }
  },

  createNote: async (title: string, content: string, category?: string) => {
    try {
      const payload: { title: string; content: string; category?: string } = { title, content };
      if (category) payload.category = category.trim();
      const newNote = await apiFetch<Note>("/notes", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      set((state) => ({
        notes: [newNote, ...state.notes],
        activeNote: newNote,
      }));
      toast.success("Note saved!");
      return newNote;
    } catch (error) {
      toast.error("Failed to save note.");
      return null;
    }
  },

  updateNote: async (id: string, title: string, content: string, category?: string) => {
    try {
      const payload: { title: string; content: string; category?: string } = { title, content };
      if (category !== undefined) payload.category = category.trim();
      const updated = await apiFetch<Note>(`/notes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      set((state) => ({
        notes: state.notes.map((n) => (n._id === id ? updated : n)),
        activeNote: state.activeNote?._id === id ? { ...state.activeNote, ...updated } : state.activeNote,
      }));
    } catch (error) {
      toast.error("Failed to update note.");
    }
  },

  bulkUpdateCategory: async (oldCategory: string, newCategory: string) => {
    try {
      await apiFetch("/notes/category/bulk", {
        method: "PATCH",
        body: JSON.stringify({ oldCategory, newCategory }),
      });
      const oldTrim = oldCategory.trim().toLowerCase();
      const newTrim = newCategory.trim();
      set((state) => ({
        notes: state.notes.map((n) =>
          (n.category || "General").trim().toLowerCase() === oldTrim
            ? { ...n, category: newTrim }
            : n
        ),
        activeNote:
          state.activeNote &&
          (state.activeNote.category || "General").trim().toLowerCase() === oldTrim
            ? { ...state.activeNote, category: newTrim }
            : state.activeNote,
      }));
    } catch (error) {
      toast.error("Failed to bulk update categories.");
    }
  },

  deleteNote: async (id: string) => {
    try {
      await apiFetch(`/notes/${id}`, { method: "DELETE" });
      set((state) => ({
        notes: state.notes.filter((n) => n._id !== id),
        activeNote: state.activeNote?._id === id ? null : state.activeNote,
      }));
      toast.success("Note deleted.");
    } catch (error) {
      toast.error("Failed to delete note.");
    }
  },

  setActiveNote: (note) => set({ activeNote: note }),
}));
