import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTodoStore, Todo } from '../use-todo-store';
import { apiFetch } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
  API_BASE_URL: 'http://localhost:5000/api/v1',
}));

describe('useTodoStore', () => {
  const mockTodo: Todo = {
    _id: '1',
    title: 'Test Todo',
    description: 'Test Description',
    isCompleted: false,
    priority: 'medium',
    subTodos: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useTodoStore.setState({ todos: [], isLoading: false, error: null });
  });

  it('fetches todos successfully', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce([mockTodo]);

    const store = useTodoStore.getState();
    await store.fetchTodos();

    expect(apiFetch).toHaveBeenCalledWith('/todo');
    expect(useTodoStore.getState().todos).toEqual([mockTodo]);
    expect(useTodoStore.getState().isLoading).toBe(false);
    expect(useTodoStore.getState().error).toBeNull();
  });

  it('adds a new todo', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(mockTodo);

    const store = useTodoStore.getState();
    await store.addTodo({ title: 'Test Todo', description: 'Test Description' });

    expect(apiFetch).toHaveBeenCalledWith('/todo', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ title: 'Test Todo', description: 'Test Description' })
    }));
    expect(useTodoStore.getState().todos).toHaveLength(1);
    expect(useTodoStore.getState().todos[0]).toEqual(mockTodo);
  });

  it('toggles a todo as complete (optimistic update)', async () => {
    // Initial state with one todo
    useTodoStore.setState({ todos: [mockTodo] });
    
    const completedTodo = { ...mockTodo, isCompleted: true };
    vi.mocked(apiFetch).mockResolvedValueOnce(completedTodo);

    const store = useTodoStore.getState();
    
    // Call toggleIsComplete and don't await immediately so we can check optimistic state
    const promise = store.toggleIsComplete('1');
    
    // Check optimistic update (should be true before fetch resolves)
    expect(useTodoStore.getState().todos[0].isCompleted).toBe(true);
    
    await promise;
    
    expect(apiFetch).toHaveBeenCalledWith('/todo/1/toggle', { method: 'PATCH' });
    expect(useTodoStore.getState().todos[0].isCompleted).toBe(true);
  });

  it('reverts optimistic update on failure', async () => {
    useTodoStore.setState({ todos: [mockTodo] });
    
    vi.mocked(apiFetch).mockRejectedValueOnce(new Error('API Error'));

    const store = useTodoStore.getState();
    
    const promise = store.toggleIsComplete('1');
    expect(useTodoStore.getState().todos[0].isCompleted).toBe(true); // Optimistic
    
    await promise;
    
    // Should revert back to false after failure
    expect(useTodoStore.getState().todos[0].isCompleted).toBe(false);
  });

  it('changes priority', async () => {
    useTodoStore.setState({ todos: [mockTodo] });
    const highPriorityTodo = { ...mockTodo, priority: 'high' };
    vi.mocked(apiFetch).mockResolvedValueOnce(highPriorityTodo);

    const store = useTodoStore.getState();
    await store.changePriority('1', 'high');

    expect(apiFetch).toHaveBeenCalledWith('/todo/1/priority', expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ priority: 'high' })
    }));
    expect(useTodoStore.getState().todos[0].priority).toBe('high');
  });

  it('deletes a todo', async () => {
    useTodoStore.setState({ todos: [mockTodo] });
    vi.mocked(apiFetch).mockResolvedValueOnce({});

    const store = useTodoStore.getState();
    
    // Delete is optimistic too
    const promise = store.deleteTodo('1');
    expect(useTodoStore.getState().todos).toHaveLength(0);
    
    await promise;
    
    expect(apiFetch).toHaveBeenCalledWith('/todo/1', { method: 'DELETE' });
    expect(useTodoStore.getState().todos).toHaveLength(0);
  });

  it('adds a sub-todo', async () => {
    useTodoStore.setState({ todos: [mockTodo] });
    const mockSubTodo = {
      _id: 'sub1',
      title: 'Sub Task',
      description: '',
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedTodo = { ...mockTodo, subTodos: [mockSubTodo] };
    
    vi.mocked(apiFetch).mockResolvedValueOnce(updatedTodo);

    const store = useTodoStore.getState();
    await store.addSubTodo('1', { title: 'Sub Task' });

    expect(apiFetch).toHaveBeenCalledWith('/todo/1/subtodos', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ title: 'Sub Task' })
    }));
    expect(useTodoStore.getState().todos[0].subTodos).toHaveLength(1);
    expect(useTodoStore.getState().todos[0].subTodos[0].title).toBe('Sub Task');
  });
});
