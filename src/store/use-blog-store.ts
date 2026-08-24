import { create } from "zustand";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

export interface PublishingPlatform {
  _id: string;
  platform: string;
  isPublished: boolean;
  publishedUrl?: string;
  publishedAt?: string;
}

export interface RepurposedContent {
  _id: string;
  title: string;
  platform: "X (Twitter)" | "LinkedIn" | "Newsletter" | "YouTube" | "Other";
  contentType: "post" | "thread" | "article" | "carousel" | "script";
  copyContent: string;
  status: "todo" | "drafted" | "scheduled" | "posted";
  dueDate?: string;
  postUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Blog {
  _id: string;
  title: string;
  description: string;
  content: string;
  status: "idea" | "drafting" | "written" | "published" | "archived";
  dueDate?: string;
  tags: string[];
  targetAudience: string;
  publishingChecklist: PublishingPlatform[];
  repurposedContent: RepurposedContent[];
  createdAt: string;
  updatedAt: string;
}

export interface TodaySocialTask {
  blogId: string;
  blogTitle: string;
  repurposeId: string;
  title: string;
  platform: string;
  contentType: string;
  copyContent: string;
  status: string;
  dueDate?: string;
}

export interface BlogDueToday {
  blogId: string;
  blogTitle: string;
  status: string;
  dueDate?: string;
}

export interface PendingPublishingItem {
  blogId: string;
  blogTitle: string;
  platforms: PublishingPlatform[];
}

export interface TodayTasks {
  todaySocialTasks: TodaySocialTask[];
  blogsDueToday: BlogDueToday[];
  pendingPublishingItems: PendingPublishingItem[];
  totalTasksCount: number;
}

interface BlogState {
  blogs: Blog[];
  todayTasks: TodayTasks | null;
  isLoading: boolean;
  isTasksLoading: boolean;
  error: string | null;
  selectedBlog: Blog | null;

  setSelectedBlog: (blog: Blog | null) => void;
  fetchBlogs: (status?: string, search?: string) => Promise<void>;
  fetchTodayTasks: () => Promise<void>;
  addBlog: (data: Partial<Blog>) => Promise<Blog | undefined>;
  updateBlog: (id: string, data: Partial<Blog>) => Promise<void>;
  deleteBlog: (id: string) => Promise<void>;
  togglePlatform: (
    blogId: string,
    payload: {
      platformId?: string;
      platformName?: string;
      isPublished?: boolean;
      publishedUrl?: string;
    }
  ) => Promise<void>;
  addCustomPlatform: (blogId: string, platform: string) => Promise<void>;
  deleteCustomPlatform: (blogId: string, platformId: string) => Promise<void>;
  addRepurposedContent: (
    blogId: string,
    data: Partial<RepurposedContent>
  ) => Promise<void>;
  updateRepurposedContent: (
    blogId: string,
    repurposeId: string,
    data: Partial<RepurposedContent>
  ) => Promise<void>;
  deleteRepurposedContent: (
    blogId: string,
    repurposeId: string
  ) => Promise<void>;
}

export const useBlogStore = create<BlogState>((set, get) => ({
  blogs: [],
  todayTasks: null,
  isLoading: false,
  isTasksLoading: false,
  error: null,
  selectedBlog: null,

  setSelectedBlog: (blog) => set({ selectedBlog: blog }),

  fetchBlogs: async (status, search) => {
    set({ isLoading: true, error: null });
    try {
      const queryParams = new URLSearchParams();
      if (status && status !== "all") queryParams.append("status", status);
      if (search) queryParams.append("search", search);

      const queryString = queryParams.toString();
      const endpoint = `/blog${queryString ? `?${queryString}` : ""}`;

      const data = await apiFetch<Blog[]>(endpoint);
      set({ blogs: data, isLoading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch blogs";
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  fetchTodayTasks: async () => {
    set({ isTasksLoading: true });
    try {
      const data = await apiFetch<TodayTasks>("/blog/today-tasks");
      set({ todayTasks: data, isTasksLoading: false });
    } catch (error) {
      set({ isTasksLoading: false });
    }
  },

  addBlog: async (data) => {
    try {
      const newBlog = await apiFetch<Blog>("/blog", {
        method: "POST",
        body: JSON.stringify(data),
      });
      set((state) => ({ blogs: [newBlog, ...state.blogs] }));
      toast.success("Blog created successfully!");
      get().fetchTodayTasks();
      return newBlog;
    } catch (error) {
      toast.error("Failed to create blog");
      return undefined;
    }
  },

  updateBlog: async (id, data) => {
    try {
      const updatedBlog = await apiFetch<Blog>(`/blog/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      set((state) => ({
        blogs: state.blogs.map((b) => (b._id === id ? updatedBlog : b)),
        selectedBlog:
          state.selectedBlog?._id === id ? updatedBlog : state.selectedBlog,
      }));
      toast.success("Blog updated successfully");
      get().fetchTodayTasks();
    } catch (error) {
      toast.error("Failed to update blog");
    }
  },

  deleteBlog: async (id) => {
    const previousBlogs = get().blogs;
    set((state) => ({
      blogs: state.blogs.filter((b) => b._id !== id),
      selectedBlog: state.selectedBlog?._id === id ? null : state.selectedBlog,
    }));

    try {
      await apiFetch(`/blog/${id}`, { method: "DELETE" });
      toast.success("Blog deleted successfully");
      get().fetchTodayTasks();
    } catch (error) {
      set({ blogs: previousBlogs });
      toast.error("Failed to delete blog");
    }
  },

  togglePlatform: async (blogId, payload) => {
    try {
      const updatedBlog = await apiFetch<Blog>(`/blog/${blogId}/checklist`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      set((state) => ({
        blogs: state.blogs.map((b) => (b._id === blogId ? updatedBlog : b)),
        selectedBlog:
          state.selectedBlog?._id === blogId
            ? updatedBlog
            : state.selectedBlog,
      }));
      toast.success("Publishing platform updated");
      get().fetchTodayTasks();
    } catch (error) {
      toast.error("Failed to update publishing platform");
    }
  },

  addCustomPlatform: async (blogId, platform) => {
    try {
      const updatedBlog = await apiFetch<Blog>(
        `/blog/${blogId}/checklist/platform`,
        {
          method: "POST",
          body: JSON.stringify({ platform }),
        }
      );
      set((state) => ({
        blogs: state.blogs.map((b) => (b._id === blogId ? updatedBlog : b)),
        selectedBlog:
          state.selectedBlog?._id === blogId
            ? updatedBlog
            : state.selectedBlog,
      }));
      toast.success(`Platform "${platform}" added to checklist`);
    } catch (error) {
      toast.error("Failed to add custom platform");
    }
  },

  deleteCustomPlatform: async (blogId, platformId) => {
    try {
      const updatedBlog = await apiFetch<Blog>(
        `/blog/${blogId}/checklist/platform/${platformId}`,
        {
          method: "DELETE",
        }
      );
      set((state) => ({
        blogs: state.blogs.map((b) => (b._id === blogId ? updatedBlog : b)),
        selectedBlog:
          state.selectedBlog?._id === blogId
            ? updatedBlog
            : state.selectedBlog,
      }));
      toast.success("Platform removed from checklist");
    } catch (error) {
      toast.error("Failed to remove platform");
    }
  },

  addRepurposedContent: async (blogId, data) => {
    try {
      const updatedBlog = await apiFetch<Blog>(`/blog/${blogId}/repurpose`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      set((state) => ({
        blogs: state.blogs.map((b) => (b._id === blogId ? updatedBlog : b)),
        selectedBlog:
          state.selectedBlog?._id === blogId
            ? updatedBlog
            : state.selectedBlog,
      }));
      toast.success("Social media content created!");
      get().fetchTodayTasks();
    } catch (error) {
      toast.error("Failed to add social content");
    }
  },

  updateRepurposedContent: async (blogId, repurposeId, data) => {
    try {
      const updatedBlog = await apiFetch<Blog>(
        `/blog/${blogId}/repurpose/${repurposeId}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        }
      );
      set((state) => ({
        blogs: state.blogs.map((b) => (b._id === blogId ? updatedBlog : b)),
        selectedBlog:
          state.selectedBlog?._id === blogId
            ? updatedBlog
            : state.selectedBlog,
      }));
      toast.success("Social content task updated");
      get().fetchTodayTasks();
    } catch (error) {
      toast.error("Failed to update social content task");
    }
  },

  deleteRepurposedContent: async (blogId, repurposeId) => {
    try {
      const updatedBlog = await apiFetch<Blog>(
        `/blog/${blogId}/repurpose/${repurposeId}`,
        {
          method: "DELETE",
        }
      );
      set((state) => ({
        blogs: state.blogs.map((b) => (b._id === blogId ? updatedBlog : b)),
        selectedBlog:
          state.selectedBlog?._id === blogId
            ? updatedBlog
            : state.selectedBlog,
      }));
      toast.success("Social content deleted");
      get().fetchTodayTasks();
    } catch (error) {
      toast.error("Failed to delete social content");
    }
  },
}));
