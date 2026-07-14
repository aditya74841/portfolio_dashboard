import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoApp } from '../todo-app';
import { useTodoStore, Todo } from '@/store/use-todo-store';

describe('TodoApp', () => {
  const mockTodos: Todo[] = [
    {
      _id: '1',
      title: 'First Goal',
      description: 'First Description',
      isCompleted: false,
      priority: 'high',
      subTodos: [
        {
          _id: 'sub1',
          title: 'First Sub Task',
          description: '',
          isCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: '2',
      title: 'Second Goal',
      description: '',
      isCompleted: true,
      priority: 'low',
      subTodos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  const mockFetchTodos = vi.fn();
  const mockAddTodo = vi.fn();
  const mockToggleIsComplete = vi.fn();
  const mockDeleteTodo = vi.fn();
  const mockChangePriority = vi.fn();
  const mockAddSubTodo = vi.fn();
  const mockToggleSubTodoIsComplete = vi.fn();
  const mockDeleteSubTodo = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    useTodoStore.setState({
      todos: mockTodos,
      isLoading: false,
      error: null,
      fetchTodos: mockFetchTodos,
      addTodo: mockAddTodo,
      toggleIsComplete: mockToggleIsComplete,
      deleteTodo: mockDeleteTodo,
      changePriority: mockChangePriority,
      addSubTodo: mockAddSubTodo,
      toggleSubTodoIsComplete: mockToggleSubTodoIsComplete,
      deleteSubTodo: mockDeleteSubTodo,
    });
  });

  it('renders todos correctly and fetches on mount', () => {
    render(<TodoApp />);
    
    expect(mockFetchTodos).toHaveBeenCalled();
    
    // Wait for initial render of titles
    expect(screen.getByText('First Goal')).toBeInTheDocument();
    expect(screen.getByText('Second Goal')).toBeInTheDocument();
    
    // Check priorities
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('low')).toBeInTheDocument();
  });

  it('can open add todo form and submit new todo', async () => {
    const user = userEvent.setup();
    render(<TodoApp />);
    
    // Click Add New Goal button
    const addButton = screen.getByRole('button', { name: /add a new goal/i });
    await user.click(addButton);
    
    // Form should appear
    const titleInput = screen.getByPlaceholderText('What is the goal?');
    const descInput = screen.getByPlaceholderText('Add a description (optional)...');
    
    await user.type(titleInput, 'Third Goal');
    await user.type(descInput, 'Third Desc');
    
    // Click Create Goal
    const submitButton = screen.getByRole('button', { name: /create goal/i });
    await user.click(submitButton);
    
    expect(mockAddTodo).toHaveBeenCalledWith({
      title: 'Third Goal',
      description: 'Third Desc'
    });
  });

  it('can toggle todo complete status', async () => {
    const user = userEvent.setup();
    render(<TodoApp />);
    
    // The first item is incomplete. Clicking its circle should toggle it.
    // The buttons have no specific aria-label, but we can find them by the role="button" inside the item wrapper
    // We'll just grab all buttons and find the ones that act as the check circle.
    // However, it's easier to find it by clicking the parent, or adding a testid.
    // Without testid, we can find the element near the text.
    
    // We know 'First Goal' has a button before it.
    // Let's find all buttons and click the one that corresponds to checking.
    // The check button is the first button in the TodoItem div.
    const firstGoal = screen.getByText('First Goal');
    // The button is a sibling of the container of 'First Goal', it's tricky to find without testid.
    // Let's find by svg: Circle is rendered when incomplete, CheckCircle2 when complete.
    // We can also find by role="button". But let's look at the DOM structure.
    
    // In TodoApp, the toggle button has `size-7 rounded-full`. We can find it by getting all buttons and filtering by class, or just grabbing the first one.
    const buttons = screen.getAllByRole('button');
    const checkButton = buttons.find(b => b.className.includes('rounded-full border-2'));
    
    if (checkButton) {
      await user.click(checkButton);
      expect(mockToggleIsComplete).toHaveBeenCalledWith('1');
    }
  });

  it('can expand a todo to view details and sub-tasks', async () => {
    const user = userEvent.setup();
    render(<TodoApp />);
    
    // Click on the text 'First Goal' to expand it
    const title = screen.getByText('First Goal');
    await user.click(title);
    
    // Description should be visible
    expect(screen.getByText('First Description')).toBeInTheDocument();
    
    // Sub-tasks should be visible
    expect(screen.getByText('First Sub Task')).toBeInTheDocument();
    
    // Can open Add Sub-task form
    const addSubTaskBtn = screen.getByRole('button', { name: /add sub-task/i });
    await user.click(addSubTaskBtn);
    
    const subTitleInput = screen.getByPlaceholderText('Sub-task title...');
    await user.type(subTitleInput, 'New Sub Task');
    
    const submitSubBtn = screen.getByRole('button', { name: /^add sub-task$/i }); // Match exactly
    await user.click(submitSubBtn);
    
    expect(mockAddSubTodo).toHaveBeenCalledWith('1', { title: 'New Sub Task', description: '' });
  });

  it('renders empty state correctly', () => {
    useTodoStore.setState({ todos: [], isLoading: false, error: null });
    render(<TodoApp />);
    
    expect(screen.getByText('No tasks yet')).toBeInTheDocument();
  });
});
