import { create } from "zustand";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

export type IdeaStatus = "idea" | "researching" | "building" | "shipped" | "paused";

export type AgentStatus = "pending" | "running" | "complete" | "failed";

export interface AgentResult {
  status: AgentStatus;
  score: number;
  summary: string;
  insights: string[];
  risks: string[];
  opportunities: string[];
  durationMs?: number;
  error?: string;
}

export interface AIAnalysis {
  status: "pending" | "running" | "complete" | "partial" | "failed";
  agents: {
    market: AgentResult;
    technical: AgentResult;
    competitor: AgentResult;
    legal: AgentResult;
  };
  aggregatedScore: number;
  model: string;
  analyzedAt: string;
}

export interface IdeaUpdate {
  _id: string;
  description: string;
  links: string[];
  createdAt: string;
}

export interface IdeaQuestion {
  _id?: string;
  category: "problem" | "target_audience" | "competition" | "technical" | "business";
  question: string;
  answer?: string | null;
  answeredAt?: string | null;
}

export interface IdeaReport {
  executiveSummary?: string;
  problemStatement?: string;
  viabilityScore?: number;
  targetAudience?: {
    description?: string;
    segments?: string[];
    painPoints?: string[];
  };
  competitors?: Array<{
    name: string;
    website?: string;
    strengths?: string[];
    weaknesses?: string[];
    differentiator?: string;
  }>;
  marketOpportunity?: {
    estimatedSize?: string;
    growthRate?: string;
    keyTrends?: string[];
    insights?: string[];
  };
  technicalComplexity?: {
    level?: "Low" | "Medium" | "High" | "Very High";
    estimatedBuildTime?: string;
    recommendedStack?: string[];
    coreChallenges?: string[];
    whatYoullLearn?: string[];
  };
  monetization?: Array<{
    model: string;
    description?: string;
    estimatedRevenue?: string;
  }>;
  risks?: Array<{
    risk: string;
    severity?: "Low" | "Medium" | "High";
    mitigation?: string;
  }>;
  legalConsiderations?: string[];
  nextSteps?: string[];
  generatedAt?: string;
  model?: string;
}

export interface Idea {
  _id: string;
  title: string;
  description: string;
  status: IdeaStatus;
  aiStatus?: "idle" | "generating_questions" | "questions_ready" | "generating_report" | "report_ready" | "failed_questions" | "failed_report";
  questions?: IdeaQuestion[];
  report?: IdeaReport | null;
  updates: IdeaUpdate[];
  aiAnalysis?: AIAnalysis | null;
  createdAt: string;
  updatedAt: string;
}

interface IdeaState {
  ideas: Idea[];
  currentIdea: Idea | null;
  isLoading: boolean;
  
  // Actions
  fetchIdeas: () => Promise<void>;
  fetchIdeaById: (id: string) => Promise<void>;
  createIdea: (data: { title: string; description: string; status?: IdeaStatus }) => Promise<void>;
  updateIdea: (id: string, data: Partial<Idea>) => Promise<void>;
  deleteIdea: (id: string) => Promise<void>;
  changeStatus: (id: string, status: IdeaStatus) => Promise<void>;
  
  // AI Analysis Actions
  fetchIdeaAnalysis: (id: string) => Promise<AIAnalysis | null>;
  reAnalyzeIdea: (id: string) => Promise<void>;
  submitAnswers: (ideaId: string, answers: Array<{ category: string; answer: string; questionId?: string }>) => Promise<void>;

  // Update Actions
  addUpdate: (ideaId: string, description: string, links?: string[]) => Promise<void>;
  editUpdate: (ideaId: string, updateId: string, description: string, links?: string[]) => Promise<void>;
  deleteUpdate: (ideaId: string, updateId: string) => Promise<void>;
}

export const useIdeaStore = create<IdeaState>((set, get) => ({
  ideas: [],
  currentIdea: null,
  isLoading: false,

  fetchIdeas: async () => {
    set({ isLoading: true });
    try {
      const data = await apiFetch<{ ideas: Idea[] }>("/idea");
      set({ ideas: data.ideas, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      toast.error("Failed to load ideas.");
    }
  },

  fetchIdeaById: async (id: string) => {
    set({ isLoading: true });
    try {
      const idea = await apiFetch<Idea>(`/idea/${id}`);
      set({ currentIdea: idea, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      toast.error("Failed to load idea details.");
    }
  },

  createIdea: async (data) => {
    try {
      const newIdea = await apiFetch<Idea>("/idea", {
        method: "POST",
        body: JSON.stringify(data),
      });
      set((state) => ({ ideas: [newIdea, ...state.ideas] }));
      toast.success("New idea captured!");
    } catch (error) {
      toast.error("Failed to capture idea.");
    }
  },

  updateIdea: async (id, data) => {
    try {
      const updatedIdea = await apiFetch<Idea>(`/idea/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      set((state) => ({
        ideas: state.ideas.map((i) => (i._id === id ? updatedIdea : i)),
        currentIdea: state.currentIdea?._id === id ? updatedIdea : state.currentIdea
      }));
      toast.success("Idea refined.");
    } catch (error) {
      toast.error("Failed to update idea.");
    }
  },

  deleteIdea: async (id) => {
    try {
      await apiFetch(`/idea/${id}`, { method: "DELETE" });
      set((state) => ({
        ideas: state.ideas.filter((i) => i._id !== id),
        currentIdea: state.currentIdea?._id === id ? null : state.currentIdea
      }));
      toast.success("Idea discarded.");
    } catch (error) {
      toast.error("Failed to delete idea.");
    }
  },

  changeStatus: async (id, status) => {
    try {
      const updatedIdea = await apiFetch<Idea>(`/idea/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      set((state) => ({
        ideas: state.ideas.map((i) => (i._id === id ? updatedIdea : i)),
        currentIdea: state.currentIdea?._id === id ? updatedIdea : state.currentIdea
      }));
      toast.success(`Moved to ${status}`);
    } catch (error) {
      toast.error("Failed to change status.");
    }
  },

  fetchIdeaAnalysis: async (id) => {
    try {
      const data = await apiFetch<{ aiAnalysis: AIAnalysis }>(`/idea/${id}/analysis`);
      // Patch the analysis into the matching idea in state
      set((state) => ({
        ideas: state.ideas.map((i) =>
          i._id === id ? { ...i, aiAnalysis: data.aiAnalysis } : i
        ),
        currentIdea:
          state.currentIdea?._id === id
            ? { ...state.currentIdea, aiAnalysis: data.aiAnalysis }
            : state.currentIdea,
      }));
      return data.aiAnalysis;
    } catch (error) {
      return null;
    }
  },

  reAnalyzeIdea: async (id) => {
    try {
      await apiFetch(`/idea/${id}/re-analyze`, { method: "POST" });
      // Reset analysis state locally so UI shows "running"
      set((state) => ({
        ideas: state.ideas.map((i) =>
          i._id === id ? { ...i, aiAnalysis: { ...i.aiAnalysis, status: "pending" } as AIAnalysis } : i
        ),
        currentIdea:
          state.currentIdea?._id === id
            ? { ...state.currentIdea, aiAnalysis: { ...state.currentIdea.aiAnalysis, status: "pending" } as AIAnalysis }
            : state.currentIdea,
      }));
      toast.info("Re-analysis started. Results will appear shortly.");
    } catch (error) {
      toast.error("Failed to trigger re-analysis.");
    }
  },

  submitAnswers: async (ideaId, answers) => {
    try {
      const updatedIdea = await apiFetch<Idea>(`/idea/${ideaId}/answers`, {
        method: "POST",
        body: JSON.stringify({ answers }),
      });
      set((state) => ({
        ideas: state.ideas.map((i) => (i._id === ideaId ? updatedIdea : i)),
        currentIdea: state.currentIdea?._id === ideaId ? updatedIdea : state.currentIdea,
      }));
      toast.success("Answers submitted! Multi-agent validation swarm started.");
    } catch (error) {
      toast.error("Failed to submit answers.");
    }
  },

  addUpdate: async (ideaId, description, links = []) => {

    try {
      const updatedIdea = await apiFetch<Idea>(`/idea/${ideaId}/updates`, {
        method: "POST",
        body: JSON.stringify({ description, links }),
      });
      set((state) => ({
        ideas: state.ideas.map((i) => (i._id === ideaId ? updatedIdea : i)),
        currentIdea: state.currentIdea?._id === ideaId ? updatedIdea : state.currentIdea
      }));
      toast.success("Update logged.");
    } catch (error) {
      toast.error("Failed to log update.");
    }
  },

  editUpdate: async (ideaId, updateId, description, links = []) => {
    try {
      const updatedIdea = await apiFetch<Idea>(`/idea/${ideaId}/updates/${updateId}`, {
        method: "PATCH",
        body: JSON.stringify({ description, links }),
      });
      set((state) => ({
        ideas: state.ideas.map((i) => (i._id === ideaId ? updatedIdea : i)),
        currentIdea: state.currentIdea?._id === ideaId ? updatedIdea : state.currentIdea
      }));
      toast.success("Log entry updated.");
    } catch (error) {
      toast.error("Failed to edit update.");
    }
  },

  deleteUpdate: async (ideaId, updateId) => {
    try {
      const updatedIdea = await apiFetch<Idea>(`/idea/${ideaId}/updates/${updateId}`, {
        method: "DELETE"
      });
      set((state) => ({
        ideas: state.ideas.map((i) => (i._id === ideaId ? updatedIdea : i)),
        currentIdea: state.currentIdea?._id === ideaId ? updatedIdea : state.currentIdea
      }));
      toast.success("Log entry removed.");
    } catch (error) {
      toast.error("Failed to remove update.");
    }
  }
}));
