import { create } from "zustand";
import { toast } from "sonner";

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  userId: number;
}

interface TodoState {
  todos: Todo[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchTodos: () => Promise<void>;
  addTodo: (title: string) => Promise<void>;
  toggleTodo: (id: number) => Promise<void>;
  deleteTodo: (id: number) => Promise<void>;
}

/**
 * Zustand store for Managing Todos with CRUD operations.
 * Demonstrates best practices for async state management and user feedback.
 */
export const useTodoStore = create<TodoState>((set, get) => ({
  todos: [],
  isLoading: false,
  error: null,

  fetchTodos: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("https://jsonplaceholder.typicode.com/todos?_limit=10");
      if (!response.ok) throw new Error("Failed to fetch todos");
      const data = await response.json();
      set({ todos: data, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch todos";
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  addTodo: async (title: string) => {
    // In a real app, you'd send a POST request
    const newTodo: Todo = {
      id: Math.max(0, ...get().todos.map(t => t.id)) + 1,
      title,
      completed: false,
      userId: 1,
    };

    // Optimistic update for better UX
    set((state) => ({ todos: [newTodo, ...state.todos] }));
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success("Task added successfully");
    } catch (error) {
      // Rollback on failure
      set((state) => ({ todos: state.todos.filter(t => t.id !== newTodo.id) }));
      toast.error("Failed to add task");
    }
  },

  toggleTodo: async (id: number) => {
    const todo = get().todos.find(t => t.id === id);
    if (!todo) return;

    // Optimistic update
    set((state) => ({
      todos: state.todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    }));

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      toast.info(`Task marked as ${!todo.completed ? 'completed' : 'incomplete'}`);
    } catch (error) {
      // Rollback
      set((state) => ({
        todos: state.todos.map(t => t.id === id ? { ...t, completed: todo.completed } : t)
      }));
      toast.error("Failed to update status");
    }
  },

  deleteTodo: async (id: number) => {
    const previousTodos = get().todos;
    
    // Optimistic update
    set((state) => ({
      todos: state.todos.filter(t => t.id !== id)
    }));

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      toast.success("Task deleted");
    } catch (error) {
      // Rollback
      set({ todos: previousTodos });
      toast.error("Failed to delete task");
    }
  },
}));
