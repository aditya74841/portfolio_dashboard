import { create } from "zustand";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

export interface SubTodo {
  _id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Todo {
  _id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  priority: "low" | "medium" | "high";
  dueDate?: string;
  subTodos: SubTodo[];
  createdAt: string;
  updatedAt: string;
}

interface TodoState {
  todos: Todo[];
  isLoading: boolean;
  error: string | null;

  // Main Todo Actions
  fetchTodos: () => Promise<void>;
  addTodo: (data: Partial<Todo>) => Promise<void>;
  updateTodo: (id: string, data: Partial<Todo>) => Promise<void>;
  toggleIsComplete: (id: string) => Promise<void>;
  changePriority: (id: string, priority: "low" | "medium" | "high") => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;

  // Sub-todo Actions
  addSubTodo: (todoId: string, data: { title: string; description?: string }) => Promise<void>;
  updateSubTodo: (todoId: string, subTodoId: string, data: Partial<SubTodo>) => Promise<void>;
  toggleSubTodoIsComplete: (todoId: string, subTodoId: string) => Promise<void>;
  deleteSubTodo: (todoId: string, subTodoId: string) => Promise<void>;
}

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: [],
  isLoading: false,
  error: null,

  fetchTodos: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiFetch<Todo[]>("/todo");
      set({ todos: data, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch todos";
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  addTodo: async (data) => {
    try {
      const newTodo = await apiFetch<Todo>("/todo", {
        method: "POST",
        body: JSON.stringify(data),
      });
      set((state) => ({ todos: [newTodo, ...state.todos] }));
      toast.success("Todo added successfully");
    } catch (error) {
      toast.error("Failed to add todo");
    }
  },

  updateTodo: async (id, data) => {
    try {
      const updatedTodo = await apiFetch<Todo>(`/todo/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      set((state) => ({
        todos: state.todos.map((t) => (t._id === id ? updatedTodo : t)),
      }));
      toast.success("Todo updated successfully");
    } catch (error) {
      toast.error("Failed to update todo");
    }
  },

  toggleIsComplete: async (id) => {
    // Optimistic update
    const previousTodos = get().todos;
    set((state) => ({
      todos: state.todos.map((t) =>
        t._id === id ? { ...t, isCompleted: !t.isCompleted } : t
      ),
    }));

    try {
      const updatedTodo = await apiFetch<Todo>(`/todo/${id}/toggle`, {
        method: "PATCH",
      });
      set((state) => ({
        todos: state.todos.map((t) => (t._id === id ? updatedTodo : t)),
      }));
      toast.success(`Task marked as ${updatedTodo.isCompleted ? "completed" : "incomplete"}`);
    } catch (error) {
      set({ todos: previousTodos });
      toast.error("Failed to toggle status");
    }
  },

  changePriority: async (id, priority) => {
    try {
      const updatedTodo = await apiFetch<Todo>(`/todo/${id}/priority`, {
        method: "PATCH",
        body: JSON.stringify({ priority }),
      });
      set((state) => ({
        todos: state.todos.map((t) => (t._id === id ? updatedTodo : t)),
      }));
      toast.success(`Priority changed to ${priority}`);
    } catch (error) {
      toast.error("Failed to change priority");
    }
  },

  deleteTodo: async (id) => {
    const previousTodos = get().todos;
    set((state) => ({
      todos: state.todos.filter((t) => t._id !== id),
    }));

    try {
      await apiFetch(`/todo/${id}`, { method: "DELETE" });
      toast.success("Todo deleted successfully");
    } catch (error) {
      set({ todos: previousTodos });
      toast.error("Failed to delete todo");
    }
  },

  addSubTodo: async (todoId, data) => {
    try {
      const updatedTodo = await apiFetch<Todo>(`/todo/${todoId}/subtodos`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      set((state) => ({
        todos: state.todos.map((t) => (t._id === todoId ? updatedTodo : t)),
      }));
      toast.success("Sub-todo added");
    } catch (error) {
      toast.error("Failed to add sub-todo");
    }
  },

  updateSubTodo: async (todoId, subTodoId, data) => {
    try {
      const updatedTodo = await apiFetch<Todo>(`/todo/${todoId}/subtodos/${subTodoId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      set((state) => ({
        todos: state.todos.map((t) => (t._id === todoId ? updatedTodo : t)),
      }));
      toast.success("Sub-todo updated");
    } catch (error) {
      toast.error("Failed to update sub-todo");
    }
  },

  toggleSubTodoIsComplete: async (todoId, subTodoId) => {
    try {
      const updatedTodo = await apiFetch<Todo>(`/todo/${todoId}/subtodos/${subTodoId}/toggle`, {
        method: "PATCH",
      });
      set((state) => ({
        todos: state.todos.map((t) => (t._id === todoId ? updatedTodo : t)),
      }));
      const sub = updatedTodo.subTodos.find(s => s._id === subTodoId);
      toast.success(`Sub-task marked as ${sub?.isCompleted ? "completed" : "incomplete"}`);
    } catch (error) {
      toast.error("Failed to toggle sub-task status");
    }
  },

  deleteSubTodo: async (todoId, subTodoId) => {
    try {
      const updatedTodo = await apiFetch<Todo>(`/todo/${todoId}/subtodos/${subTodoId}`, {
        method: "DELETE",
      });
      set((state) => ({
        todos: state.todos.map((t) => (t._id === todoId ? updatedTodo : t)),
      }));
      toast.success("Sub-todo deleted");
    } catch (error) {
      toast.error("Failed to delete sub-todo");
    }
  },
}));
