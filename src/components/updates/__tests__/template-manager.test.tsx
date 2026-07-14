import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TemplateManager } from '../template-manager';
import { useUpdateStore } from '@/store/use-update-store';

describe('TemplateManager', () => {
  const mockTemplate = {
    _id: 't1',
    name: 'Daily Template',
    questions: ['Question 1'],
    isActive: true,
  };

  const mockFetchTemplates = vi.fn();
  const mockCreateTemplate = vi.fn();
  const mockUpdateTemplate = vi.fn();
  const mockAddTemplateQuestion = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    useUpdateStore.setState({
      templates: [mockTemplate] as any,
      fetchTemplates: mockFetchTemplates,
      createTemplate: mockCreateTemplate,
      updateTemplate: mockUpdateTemplate,
      addTemplateQuestion: mockAddTemplateQuestion,
    } as any);
  });

  it('renders templates correctly', () => {
    render(<TemplateManager />);
    
    expect(mockFetchTemplates).toHaveBeenCalled();
    expect(screen.getByText('Daily Template')).toBeInTheDocument();
    expect(screen.getByText('Question 1')).toBeInTheDocument();
  });

  it('creates a new template', async () => {
    const user = userEvent.setup();
    render(<TemplateManager />);
    
    const input = screen.getByPlaceholderText('Template Name (e.g. Work Days, Weekends)');
    await user.clear(input);
    await user.type(input, 'New Template');
    
    const createBtn = screen.getByRole('button', { name: /create/i });
    await user.click(createBtn);
    
    expect(mockCreateTemplate).toHaveBeenCalledWith('New Template');
  });

  it('adds a new question to template via enter key', async () => {
    const user = userEvent.setup();
    render(<TemplateManager />);
    
    const input = screen.getByPlaceholderText('Add recurring question...');
    await user.type(input, 'New Question{enter}');
    
    expect(mockAddTemplateQuestion).toHaveBeenCalledWith('t1', 'New Question');
  });
});
