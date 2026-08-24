import { create } from "zustand";
import { apiFetch } from "@/lib/api";

export interface TechItem {
  _id?: string;
  name: string;
  description?: string;
}

export interface TechCategory {
  _id?: string;
  category: string;
  items: TechItem[];
}

export type ProjectStatus = "building" | "deployed" | "maintaining" | "archived";

export interface Project {
  _id: string;
  userId: string;
  name: string;
  slug: string;
  description: string;
  motive: string;
  status: ProjectStatus;
  techStack: TechCategory[];
  githubUrl?: string;
  liveUrl?: string;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type EntryType = "update" | "difficulty" | "learning" | "milestone";

export interface ProjectEntry {
  _id: string;
  projectId: string;
  userId: string;
  type: EntryType;
  title: string;
  content: string;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ProjectState {
  projects: Project[];
  activeProject: Project | null;
  entries: ProjectEntry[];
  isLoading: boolean;
  isEntriesLoading: boolean;
  error: string | null;
  statusFilter: string;
  searchQuery: string;
  entryTypeFilter: string;

  // Setters
  setStatusFilter: (status: string) => void;
  setSearchQuery: (search: string) => void;
  setEntryTypeFilter: (type: string) => void;
  setActiveProject: (project: Project | null) => void;

  // Project Actions
  fetchProjects: (params?: { status?: string; search?: string }) => Promise<void>;
  fetchProjectBySlug: (slug: string) => Promise<Project | null>;
  fetchProjectById: (id: string) => Promise<Project | null>;
  createProject: (data: Partial<Project>) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  updateProjectStatus: (id: string, status: ProjectStatus) => Promise<Project>;
  addTechCategory: (projectId: string, category: string) => Promise<Project>;
  removeTechCategory: (projectId: string, category: string) => Promise<Project>;
  addTechItem: (projectId: string, category: string, item: TechItem) => Promise<Project>;
  removeTechItem: (projectId: string, category: string, itemName: string) => Promise<Project>;

  // Entry Actions
  fetchEntries: (projectId: string, params?: { type?: string; isPublic?: boolean }) => Promise<void>;
  createEntry: (projectId: string, data: Partial<ProjectEntry>) => Promise<ProjectEntry>;
  updateEntry: (entryId: string, data: Partial<ProjectEntry>) => Promise<ProjectEntry>;
  deleteEntry: (entryId: string) => Promise<void>;
  toggleEntryVisibility: (entryId: string, isPublic: boolean) => Promise<ProjectEntry>;
  addEntryTags: (entryId: string, tags: string[]) => Promise<ProjectEntry>;
  removeEntryTag: (entryId: string, tag: string) => Promise<ProjectEntry>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  activeProject: null,
  entries: [],
  isLoading: false,
  isEntriesLoading: false,
  error: null,
  statusFilter: "all",
  searchQuery: "",
  entryTypeFilter: "all",

  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setEntryTypeFilter: (entryTypeFilter) => set({ entryTypeFilter }),
  setActiveProject: (activeProject) => set({ activeProject }),

  // ----------------------------------------
  // Projects API
  // ----------------------------------------
  fetchProjects: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const queryParts: string[] = [];
      const status = params.status || get().statusFilter;
      const search = params.search !== undefined ? params.search : get().searchQuery;

      if (status && status !== "all") queryParts.push(`status=${encodeURIComponent(status)}`);
      if (search) queryParts.push(`search=${encodeURIComponent(search)}`);
      queryParts.push(`limit=50`);

      const queryString = queryParts.length ? `?${queryParts.join("&")}` : "";
      const res = await apiFetch<PaginatedResponse<Project>>(`/project-diary${queryString}`);
      set({ projects: res.docs || [], isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch projects";
      set({ error: message, isLoading: false });
    }
  },

  fetchProjectBySlug: async (slug: string) => {
    set({ isLoading: true, error: null });
    try {
      const project = await apiFetch<Project>(`/project-diary/slug/${slug}`);
      set({ activeProject: project, isLoading: false });
      return project;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Project not found";
      set({ error: message, isLoading: false });
      return null;
    }
  },

  fetchProjectById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const project = await apiFetch<Project>(`/project-diary/${id}`);
      set({ activeProject: project, isLoading: false });
      return project;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Project not found";
      set({ error: message, isLoading: false });
      return null;
    }
  },

  createProject: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const project = await apiFetch<Project>("/project-diary", {
        method: "POST",
        body: JSON.stringify(data),
      });
      set((state) => ({
        projects: [project, ...state.projects],
        isLoading: false,
      }));
      return project;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create project";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  updateProject: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await apiFetch<Project>(`/project-diary/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      set((state) => ({
        projects: state.projects.map((p) => (p._id === id ? updated : p)),
        activeProject: state.activeProject?._id === id ? updated : state.activeProject,
        isLoading: false,
      }));
      return updated;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update project";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  deleteProject: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiFetch(`/project-diary/${id}`, { method: "DELETE" });
      set((state) => ({
        projects: state.projects.filter((p) => p._id !== id),
        activeProject: state.activeProject?._id === id ? null : state.activeProject,
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete project";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  updateProjectStatus: async (id, status) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await apiFetch<Project>(`/project-diary/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      set((state) => ({
        projects: state.projects.map((p) => (p._id === id ? updated : p)),
        activeProject: state.activeProject?._id === id ? updated : state.activeProject,
        isLoading: false,
      }));
      return updated;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update status";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  addTechCategory: async (projectId, category) => {
    try {
      const updated = await apiFetch<Project>(`/project-diary/${projectId}/tech-categories`, {
        method: "POST",
        body: JSON.stringify({ category }),
      });
      set((state) => ({
        projects: state.projects.map((p) => (p._id === projectId ? updated : p)),
        activeProject: state.activeProject?._id === projectId ? updated : state.activeProject,
      }));
      return updated;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add category";
      set({ error: message });
      throw err;
    }
  },

  removeTechCategory: async (projectId, category) => {
    try {
      const updated = await apiFetch<Project>(`/project-diary/${projectId}/tech-categories`, {
        method: "DELETE",
        body: JSON.stringify({ category }),
      });
      set((state) => ({
        projects: state.projects.map((p) => (p._id === projectId ? updated : p)),
        activeProject: state.activeProject?._id === projectId ? updated : state.activeProject,
      }));
      return updated;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to remove category";
      set({ error: message });
      throw err;
    }
  },

  addTechItem: async (projectId, category, item) => {
    try {
      const updated = await apiFetch<Project>(`/project-diary/${projectId}/tech-items`, {
        method: "POST",
        body: JSON.stringify({ category, item }),
      });
      set((state) => ({
        projects: state.projects.map((p) => (p._id === projectId ? updated : p)),
        activeProject: state.activeProject?._id === projectId ? updated : state.activeProject,
      }));
      return updated;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add tech item";
      set({ error: message });
      throw err;
    }
  },

  removeTechItem: async (projectId, category, itemName) => {
    try {
      const updated = await apiFetch<Project>(`/project-diary/${projectId}/tech-items`, {
        method: "DELETE",
        body: JSON.stringify({ category, itemName }),
      });
      set((state) => ({
        projects: state.projects.map((p) => (p._id === projectId ? updated : p)),
        activeProject: state.activeProject?._id === projectId ? updated : state.activeProject,
      }));
      return updated;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to remove tech item";
      set({ error: message });
      throw err;
    }
  },

  // ----------------------------------------
  // Entries (Timeline) API
  // ----------------------------------------
  fetchEntries: async (projectId, params = {}) => {
    set({ isEntriesLoading: true, error: null });
    try {
      const queryParts: string[] = [];
      const type = params.type || get().entryTypeFilter;

      if (type && type !== "all") queryParts.push(`type=${encodeURIComponent(type)}`);
      if (typeof params.isPublic === "boolean") queryParts.push(`isPublic=${params.isPublic}`);
      queryParts.push(`limit=100`);

      const queryString = queryParts.length ? `?${queryParts.join("&")}` : "";
      const res = await apiFetch<PaginatedResponse<ProjectEntry>>(
        `/project-diary/${projectId}/entries${queryString}`
      );
      set({ entries: res.docs || [], isEntriesLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch entries";
      set({ error: message, isEntriesLoading: false });
    }
  },

  createEntry: async (projectId, data) => {
    try {
      const entry = await apiFetch<ProjectEntry>(`/project-diary/${projectId}/entries`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      set((state) => ({
        entries: [entry, ...state.entries],
      }));
      return entry;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create entry";
      set({ error: message });
      throw err;
    }
  },

  updateEntry: async (entryId, data) => {
    try {
      const updated = await apiFetch<ProjectEntry>(`/project-diary/entries/${entryId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      set((state) => ({
        entries: state.entries.map((e) => (e._id === entryId ? updated : e)),
      }));
      return updated;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update entry";
      set({ error: message });
      throw err;
    }
  },

  deleteEntry: async (entryId) => {
    try {
      await apiFetch(`/project-diary/entries/${entryId}`, { method: "DELETE" });
      set((state) => ({
        entries: state.entries.filter((e) => e._id !== entryId),
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete entry";
      set({ error: message });
      throw err;
    }
  },

  toggleEntryVisibility: async (entryId, isPublic) => {
    try {
      const updated = await apiFetch<ProjectEntry>(`/project-diary/entries/${entryId}/visibility`, {
        method: "PATCH",
        body: JSON.stringify({ isPublic }),
      });
      set((state) => ({
        entries: state.entries.map((e) => (e._id === entryId ? updated : e)),
      }));
      return updated;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to change visibility";
      set({ error: message });
      throw err;
    }
  },

  addEntryTags: async (entryId, tags) => {
    try {
      const updated = await apiFetch<ProjectEntry>(`/project-diary/entries/${entryId}/tags`, {
        method: "POST",
        body: JSON.stringify({ tags }),
      });
      set((state) => ({
        entries: state.entries.map((e) => (e._id === entryId ? updated : e)),
      }));
      return updated;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add tags";
      set({ error: message });
      throw err;
    }
  },

  removeEntryTag: async (entryId, tag) => {
    try {
      const updated = await apiFetch<ProjectEntry>(`/project-diary/entries/${entryId}/tags`, {
        method: "DELETE",
        body: JSON.stringify({ tag }),
      });
      set((state) => ({
        entries: state.entries.map((e) => (e._id === entryId ? updated : e)),
      }));
      return updated;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to remove tag";
      set({ error: message });
      throw err;
    }
  },
}));