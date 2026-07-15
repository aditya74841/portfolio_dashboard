import { create } from "zustand";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

export interface Note {
  _id: string;
  content: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface NoteState {
  notes: Note[];
  activeNote: Note | null;
  isLoading: boolean;
  
  fetchNotes: () => Promise<void>;
  createNote: (content: string) => Promise<Note | null>;
  updateNote: (id: string, content: string) => Promise<void>;
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
      const notes = await apiFetch<Note[]>("/notes");
      set({ notes: notes || [], isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      toast.error("Failed to load notes.");
    }
  },

  createNote: async (content: string) => {
    set({ isLoading: true });
    try {
      const newNote = await apiFetch<Note>("/notes", {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      set((state) => ({ 
        notes: [newNote, ...state.notes],
        activeNote: newNote,
        isLoading: false
      }));
      toast.success("Note saved!");
      return newNote;
    } catch (error) {
      set({ isLoading: false });
      toast.error("Failed to save note.");
      return null;
    }
  },

  updateNote: async (id: string, content: string) => {
    try {
      const updated = await apiFetch<Note>(`/notes/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ content }),
      });
      set((state) => ({
        notes: state.notes.map((n) => (n._id === id ? updated : n)),
        activeNote: state.activeNote?._id === id ? updated : state.activeNote
      }));
      toast.success("Note updated!");
    } catch (error) {
      toast.error("Failed to update note.");
    }
  },

  deleteNote: async (id: string) => {
    try {
      await apiFetch(`/notes/${id}`, { method: "DELETE" });
      set((state) => ({
        notes: state.notes.filter((n) => n._id !== id),
        activeNote: state.activeNote?._id === id ? null : state.activeNote
      }));
      toast.success("Note deleted.");
    } catch (error) {
      toast.error("Failed to delete note.");
    }
  },
  
  setActiveNote: (note) => set({ activeNote: note }),
}));
