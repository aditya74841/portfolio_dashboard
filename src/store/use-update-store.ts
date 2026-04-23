import { create } from "zustand";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

export interface QA {
  question: string;
  answer: string;
}

export interface JournalUpdate {
  _id: string;
  title: string;
  date: string;
  qas: QA[];
  update: string;
  mood: "great" | "good" | "okay" | "bad";
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionTemplate {
  _id: string;
  name: string;
  questions: string[];
  isActive: boolean;
}

interface UpdateState {
  updates: JournalUpdate[];
  templates: QuestionTemplate[];
  activeTemplate: QuestionTemplate | null;
  isLoading: boolean;

  // Update Actions
  fetchUpdates: () => Promise<void>;
  createUpdate: (data: { title?: string; date: string }) => Promise<void>;
  updateTitle: (id: string, title: string) => Promise<void>;
  updateMood: (id: string, mood: string) => Promise<void>;
  updateContent: (id: string, update: string) => Promise<void>;
  toggleIsPublic: (id: string) => Promise<void>;
  deleteUpdate: (id: string) => Promise<void>;

  // QA Actions
  addQA: (id: string, question: string, answer?: string) => Promise<void>;
  updateQuestion: (id: string, index: number, question: string) => Promise<void>;
  updateAnswer: (id: string, index: number, answer: string) => Promise<void>;
  deleteQA: (id: string, index: number) => Promise<void>;

  // Template Actions
  fetchTemplates: () => Promise<void>;
  fetchActiveTemplate: () => Promise<void>;
  createTemplate: (name: string, questions?: string[]) => Promise<void>;
  updateTemplate: (id: string, data: Partial<QuestionTemplate>) => Promise<void>;
  addTemplateQuestion: (id: string, question: string) => Promise<void>;
  updateTemplateQuestion: (id: string, index: number, question: string) => Promise<void>;
  deleteTemplateQuestion: (id: string, index: number) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
}

export const useUpdateStore = create<UpdateState>((set, get) => ({
  updates: [],
  templates: [],
  activeTemplate: null,
  isLoading: false,

  fetchUpdates: async () => {
    set({ isLoading: true });
    try {
      const updates = await apiFetch<JournalUpdate[]>("/update");
      set({ updates, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      toast.error("Failed to load journal updates.");
    }
  },

  createUpdate: async (data) => {
    try {
      const newUpdate = await apiFetch<JournalUpdate>("/update", {
        method: "POST",
        body: JSON.stringify(data),
      });
      set((state) => ({ updates: [newUpdate, ...state.updates] }));
      toast.success("New journal entry started!");
    } catch (error: any) {
      toast.error(error.message || "Failed to start entry.");
    }
  },

  updateTitle: async (id, title) => {
    try {
      const updated = await apiFetch<JournalUpdate>(`/update/${id}/title`, {
        method: "PATCH",
        body: JSON.stringify({ title }),
      });
      set((state) => ({
        updates: state.updates.map((u) => (u._id === id ? updated : u)),
      }));
    } catch (error) {
      toast.error("Failed to update title.");
    }
  },

  updateMood: async (id, mood) => {
    try {
      const updated = await apiFetch<JournalUpdate>(`/update/${id}/mood`, {
        method: "PATCH",
        body: JSON.stringify({ mood }),
      });
      set((state) => ({
        updates: state.updates.map((u) => (u._id === id ? updated : u)),
      }));
      toast.success(`Mood set to ${mood}`);
    } catch (error) {
      toast.error("Failed to update mood.");
    }
  },

  updateContent: async (id, update) => {
    try {
      const updated = await apiFetch<JournalUpdate>(`/update/${id}/content`, {
        method: "PATCH",
        body: JSON.stringify({ update }),
      });
      set((state) => ({
        updates: state.updates.map((u) => (u._id === id ? updated : u)),
      }));
    } catch (error) {
      toast.error("Failed to save entry.");
    }
  },

  toggleIsPublic: async (id) => {
    try {
      const updated = await apiFetch<JournalUpdate>(`/update/${id}/toggle-visibility`, {
        method: "PATCH",
      });
      set((state) => ({
        updates: state.updates.map((u) => (u._id === id ? updated : u)),
      }));
      toast.success(`Entry is now ${updated.isPublic ? "Public" : "Private"}`);
    } catch (error) {
      toast.error("Failed to toggle visibility.");
    }
  },

  deleteUpdate: async (id) => {
    try {
      await apiFetch(`/update/${id}`, { method: "DELETE" });
      set((state) => ({
        updates: state.updates.filter((u) => u._id !== id),
      }));
      toast.success("Journal entry deleted.");
    } catch (error) {
      toast.error("Failed to delete entry.");
    }
  },

  // QA Actions
  addQA: async (id, question, answer = "") => {
    try {
      const updated = await apiFetch<JournalUpdate>(`/update/${id}/qa`, {
        method: "POST",
        body: JSON.stringify({ question, answer }),
      });
      set((state) => ({
        updates: state.updates.map((u) => (u._id === id ? updated : u)),
      }));
      toast.success("Question added.");
    } catch (error) {
      toast.error("Failed to add question.");
    }
  },

  updateQuestion: async (id, index, question) => {
    try {
      const updated = await apiFetch<JournalUpdate>(`/update/${id}/qa/question`, {
        method: "PATCH",
        body: JSON.stringify({ index, question }),
      });
      set((state) => ({
        updates: state.updates.map((u) => (u._id === id ? updated : u)),
      }));
    } catch (error) {
      toast.error("Failed to update question.");
    }
  },

  updateAnswer: async (id, index, answer) => {
    try {
      const updated = await apiFetch<JournalUpdate>(`/update/${id}/qa/answer`, {
        method: "PATCH",
        body: JSON.stringify({ index, answer }),
      });
      set((state) => ({
        updates: state.updates.map((u) => (u._id === id ? updated : u)),
      }));
    } catch (error) {
      toast.error("Failed to save answer.");
    }
  },

  deleteQA: async (id, index) => {
    try {
      const updated = await apiFetch<JournalUpdate>(`/update/${id}/qa`, {
        method: "DELETE",
        body: JSON.stringify({ index }),
      });
      set((state) => ({
        updates: state.updates.map((u) => (u._id === id ? updated : u)),
      }));
      toast.success("Question removed.");
    } catch (error) {
      toast.error("Failed to remove question.");
    }
  },

  // Template Actions
  fetchTemplates: async () => {
    try {
      const templates = await apiFetch<QuestionTemplate[]>("/template");
      set({ templates });
    } catch (error) {
      toast.error("Failed to load templates.");
    }
  },

  fetchActiveTemplate: async () => {
    try {
      const activeTemplate = await apiFetch<QuestionTemplate>("/template/active");
      set({ activeTemplate });
    } catch (error) {
      // Quietly fail if no active template
    }
  },

  createTemplate: async (name, questions = []) => {
    try {
      const newTemplate = await apiFetch<QuestionTemplate>("/template", {
        method: "POST",
        body: JSON.stringify({ name, questions }),
      });
      set((state) => ({ templates: [...state.templates, newTemplate] }));
      toast.success("Template created!");
    } catch (error) {
      toast.error("Failed to create template.");
    }
  },

  updateTemplate: async (id, data) => {
    try {
      const updated = await apiFetch<QuestionTemplate>(`/template/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      set((state) => ({
        templates: state.templates.map((t) => (t._id === id ? updated : t)),
        activeTemplate: updated.isActive ? updated : (state.activeTemplate?._id === id ? null : state.activeTemplate)
      }));
      toast.success("Template updated.");
    } catch (error) {
      toast.error("Failed to update template.");
    }
  },

  addTemplateQuestion: async (id, question) => {
    try {
      const updated = await apiFetch<QuestionTemplate>(`/template/${id}/questions`, {
        method: "POST",
        body: JSON.stringify({ question }),
      });
      set((state) => ({
        templates: state.templates.map((t) => (t._id === id ? updated : t)),
        activeTemplate: state.activeTemplate?._id === id ? updated : state.activeTemplate
      }));
      toast.success("Question added to template.");
    } catch (error) {
      toast.error("Failed to add template question.");
    }
  },

  updateTemplateQuestion: async (id, index, question) => {
    try {
      const updated = await apiFetch<QuestionTemplate>(`/template/${id}/questions`, {
        method: "PATCH",
        body: JSON.stringify({ index, question }),
      });
      set((state) => ({
        templates: state.templates.map((t) => (t._id === id ? updated : t)),
        activeTemplate: state.activeTemplate?._id === id ? updated : state.activeTemplate
      }));
    } catch (error) {
      toast.error("Failed to update template question.");
    }
  },

  deleteTemplateQuestion: async (id, index) => {
    try {
      const updated = await apiFetch<QuestionTemplate>(`/template/${id}/questions`, {
        method: "DELETE",
        body: JSON.stringify({ index }),
      });
      set((state) => ({
        templates: state.templates.map((t) => (t._id === id ? updated : t)),
        activeTemplate: state.activeTemplate?._id === id ? updated : state.activeTemplate
      }));
      toast.success("Template question removed.");
    } catch (error) {
      toast.error("Failed to remove template question.");
    }
  },

  deleteTemplate: async (id) => {
    try {
      await apiFetch(`/template/${id}`, { method: "DELETE" });
      set((state) => ({
        templates: state.templates.filter((t) => t._id !== id),
        activeTemplate: state.activeTemplate?._id === id ? null : state.activeTemplate
      }));
      toast.success("Template deleted.");
    } catch (error) {
      toast.error("Failed to delete template.");
    }
  }
}));
