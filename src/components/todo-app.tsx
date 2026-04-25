"use client";

import { useEffect, useState } from "react";
import { useTodoStore, Todo, SubTodo } from "@/store/use-todo-store";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { 
  Loader2, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Flag,
  MoreVertical,
  Circle,
  CheckCircle2,
  FileText
} from "lucide-react";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";

export function TodoApp() {
  const { 
    todos, 
    isLoading, 
    error, 
    fetchTodos, 
    addTodo, 
    toggleIsComplete, 
    deleteTodo,
    changePriority,
    addSubTodo,
    toggleSubTodoIsComplete,
    deleteSubTodo,
    updateTodo,
    updateSubTodo
  } = useTodoStore();

  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [newTodoDesc, setNewTodoDesc] = useState("");
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [expandedTodo, setExpandedTodo] = useState<string | null>(null);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;
    await addTodo({ 
      title: newTodoTitle.trim(), 
      description: newTodoDesc.trim() 
    });
    setNewTodoTitle("");
    setNewTodoDesc("");
    setIsAddingTodo(false);
  };

  const priorityColors = {
    low: "text-blue-500 bg-blue-500/10",
    medium: "text-yellow-500 bg-yellow-500/10",
    high: "text-red-500 bg-red-500/10",
  };

  return (
    <ErrorBoundary className="w-full max-w-2xl mx-auto">
      <Card className="shadow-2xl border-primary/5 bg-background/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight flex items-center gap-3">
            Task Center
            {isLoading && <Loader2 className="size-5 animate-spin text-primary" />}
          </CardTitle>
          <CardDescription className="text-base">
            Organize your goals, break them into sub-tasks, and track progress.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add Todo Form */}
          {!isAddingTodo ? (
            <Button 
              onClick={() => setIsAddingTodo(true)}
              className="w-full h-14 text-lg rounded-xl border-dashed border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary-foreground/70 hover:text-primary transition-all"
              variant="outline"
            >
              <Plus className="mr-2 size-5" /> Add a new goal
            </Button>
          ) : (
            <form onSubmit={handleAddTodo} className="space-y-4 p-5 rounded-xl border border-primary/20 bg-card/50 animate-in zoom-in-95 duration-200">
              <div className="space-y-2">
                <Input
                  placeholder="What is the goal?"
                  value={newTodoTitle}
                  onChange={(e) => setNewTodoTitle(e.target.value)}
                  autoFocus
                  className="text-lg font-semibold bg-transparent border-none focus-visible:ring-0 px-0 h-auto"
                />
                <Textarea
                  placeholder="Add a description (optional)..."
                  value={newTodoDesc}
                  onChange={(e) => setNewTodoDesc(e.target.value)}
                  className="resize-none bg-transparent border-none focus-visible:ring-0 px-0 min-h-[80px]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsAddingTodo(false)}>Cancel</Button>
                <Button type="submit" disabled={!newTodoTitle.trim()}>Create Goal</Button>
              </div>
            </form>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20 animate-in fade-in zoom-in duration-300">
              <AlertCircle className="size-5" />
              <div className="flex-1 font-medium">{error}</div>
              <Button variant="ghost" size="sm" onClick={() => fetchTodos()} className="hover:bg-destructive/20 h-8 px-3">
                Retry
              </Button>
            </div>
          )}

          {/* List Wrapper */}
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {todos.length === 0 && !isLoading && !error && (
              <div className="text-center py-20 text-muted-foreground animate-in fade-in slide-in-from-bottom-4">
                <div className="size-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Plus className="size-8 opacity-20" />
                </div>
                <p className="text-lg font-medium">No tasks yet</p>
                <p className="text-sm opacity-70">Break down your big ideas into manageable steps.</p>
              </div>
            )}

            {todos.map((todo) => (
              <TodoItem 
                key={todo._id} 
                todo={todo}
                isExpanded={expandedTodo === todo._id}
                onToggleExpand={() => setExpandedTodo(expandedTodo === todo._id ? null : todo._id)}
                toggleIsComplete={toggleIsComplete}
                deleteTodo={deleteTodo}
                changePriority={changePriority}
                addSubTodo={addSubTodo}
                toggleSubTodoIsComplete={toggleSubTodoIsComplete}
                deleteSubTodo={deleteSubTodo}
                updateTodo={updateTodo}
                updateSubTodo={updateSubTodo}
                priorityColors={priorityColors}
              />
            ))}

            {isLoading && todos.length === 0 && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 w-full bg-muted/30 rounded-2xl animate-pulse" />
                ))}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground flex justify-between border-t border-primary/5 pt-6 bg-accent/5 rounded-b-2xl">
          <div className="flex gap-4">
            <span className="font-medium text-primary">{todos.filter(t => !t.isCompleted).length} pending</span>
            <span className="opacity-50">|</span>
            <span className="opacity-70">{todos.filter(t => t.isCompleted).length} completed</span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest opacity-40">System Active</span>
        </CardFooter>
      </Card>
    </ErrorBoundary>
  );
}

function TodoItem({ 
  todo, 
  isExpanded, 
  onToggleExpand,
  toggleIsComplete,
  deleteTodo,
  changePriority,
  addSubTodo,
  toggleSubTodoIsComplete,
  deleteSubTodo,
  updateTodo,
  updateSubTodo,
  priorityColors
}: { 
  todo: Todo;
  isExpanded: boolean;
  onToggleExpand: () => void;
  toggleIsComplete: (id: string) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  changePriority: (id: string, priority: "low" | "medium" | "high") => Promise<void>;
  addSubTodo: (id: string, data: { title: string; description?: string }) => Promise<void>;
  toggleSubTodoIsComplete: (todoId: string, subTodoId: string) => Promise<void>;
  deleteSubTodo: (todoId: string, subTodoId: string) => Promise<void>;
  updateTodo: (id: string, data: Partial<Todo>) => Promise<void>;
  updateSubTodo: (todoId: string, subTodoId: string, data: Partial<SubTodo>) => Promise<void>;
  priorityColors: any;
}) {
  const [newSubTitle, setNewSubTitle] = useState("");
  const [newSubDesc, setNewSubDesc] = useState("");
  const [isAddingSub, setIsAddingSub] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [tempDesc, setTempDesc] = useState(todo.description || "");

  const handleSaveDesc = async () => {
    await updateTodo(todo._id, { description: tempDesc });
    setIsEditingDesc(false);
  };

  return (
    <div className={cn(
      "group rounded-2xl border transition-all duration-500 bg-card/40 overflow-hidden",
      todo.isCompleted ? "border-primary/5 opacity-80" : "border-primary/10 hover:border-primary/30 shadow-sm hover:shadow-md",
      isExpanded && "ring-2 ring-primary/20 bg-card shadow-xl"
    )}>
      <div className="p-4 flex items-center gap-4">
        <button
          type="button"
          onClick={() => toggleIsComplete(todo._id)}
          className={cn(
            "size-7 rounded-full border-2 flex items-center justify-center transition-all duration-300",
            todo.isCompleted 
              ? "bg-primary border-primary text-primary-foreground" 
              : "border-primary/30 hover:border-primary/60"
          )}
        >
          {todo.isCompleted ? <CheckCircle2 className="size-5" /> : <Circle className="size-5 opacity-40" />}
        </button>

        <div className="flex-1 min-w-0" onClick={onToggleExpand} role="button">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={cn(
              "font-semibold text-lg truncate transition-all duration-300",
              todo.isCompleted ? "line-through text-muted-foreground opacity-50" : "text-foreground"
            )}>
              {todo.title}
            </h3>
            <Badge variant="outline" className={cn("text-[10px] uppercase font-bold", priorityColors[todo.priority])}>
              {todo.priority}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
             <span className="flex items-center gap-1">
               <Check className="size-3" />
               {todo.subTodos.filter(s => s.isCompleted).length}/{todo.subTodos.length} sub-tasks
             </span>
             {todo.dueDate && (
               <span className="text-primary/70 font-medium">Due {new Date(todo.dueDate).toLocaleDateString()}</span>
             )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-9 rounded-lg">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl">
              <DropdownMenuItem onClick={() => changePriority(todo._id, "high")} className="text-red-500 focus:text-red-600">
                High Priority
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changePriority(todo._id, "medium")} className="text-yellow-500">
                Medium Priority
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changePriority(todo._id, "low")} className="text-blue-500">
                Low Priority
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => deleteTodo(todo._id)} className="text-destructive focus:bg-destructive/10">
                <Trash2 className="size-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" onClick={onToggleExpand} className="size-9 rounded-lg">
            {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-12 pb-6 pt-2 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Main Todo Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">Description</p>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => setIsEditingDesc(!isEditingDesc)}>
                {isEditingDesc ? "Cancel" : todo.description ? "Edit" : "Add Description"}
              </Button>
            </div>
            {isEditingDesc ? (
              <div className="space-y-2">
                <Textarea 
                  value={tempDesc}
                  onChange={(e) => setTempDesc(e.target.value)}
                  placeholder="Enter goal description..."
                  className="text-sm bg-accent/20 min-h-[80px]"
                />
                <div className="flex justify-end">
                  <Button size="sm" onClick={handleSaveDesc}>Save Description</Button>
                </div>
              </div>
            ) : todo.description ? (
              <p className="text-sm text-muted-foreground bg-accent/30 p-3 rounded-lg border border-border/50 whitespace-pre-wrap">
                {todo.description}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground italic px-1">No description added.</p>
            )}
          </div>

          {/* Sub-tasks Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">Sub-tasks</p>
              {!isAddingSub && (
                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => setIsAddingSub(true)}>
                  Add Sub-task
                </Button>
              )}
            </div>
            
            {todo.subTodos.map((sub) => (
              <div key={sub._id} className="flex items-start justify-between group/sub px-2 py-2 rounded-lg hover:bg-accent/40 transition-all border border-transparent hover:border-border/50">
                <div className="flex gap-3">
                  <button 
                    onClick={() => toggleSubTodoIsComplete(todo._id, sub._id)}
                    className={cn(
                      "mt-0.5 size-4 rounded border flex items-center justify-center transition-all",
                      sub.isCompleted ? "bg-primary text-primary-foreground border-primary" : "border-muted-foreground/30"
                    )}
                  >
                    {sub.isCompleted && <Check className="size-3" />}
                  </button>
                  <div className="space-y-1">
                    <span className={cn(
                      "text-sm font-medium transition-all block",
                      sub.isCompleted ? "line-through text-muted-foreground opacity-60" : "text-foreground"
                    )}>
                      {sub.title}
                    </span>
                    {sub.description && (
                      <p className="text-xs text-muted-foreground/70">{sub.description}</p>
                    )}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => deleteSubTodo(todo._id, sub._id)}
                  className="size-7 opacity-0 group-hover/sub:opacity-100 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}

            {isAddingSub && (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newSubTitle.trim()) return;
                  addSubTodo(todo._id, { title: newSubTitle, description: newSubDesc });
                  setNewSubTitle("");
                  setNewSubDesc("");
                  setIsAddingSub(false);
                }}
                className="space-y-3 p-4 rounded-xl border border-primary/10 bg-accent/10 animate-in slide-in-from-top-2"
              >
                <Input 
                  placeholder="Sub-task title..." 
                  value={newSubTitle}
                  onChange={(e) => setNewSubTitle(e.target.value)}
                  autoFocus
                  className="h-9 text-sm"
                />
                <Textarea 
                  placeholder="Sub-task description (optional)..." 
                  value={newSubDesc}
                  onChange={(e) => setNewSubDesc(e.target.value)}
                  className="text-xs min-h-[60px] resize-none"
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingSub(false)}>Cancel</Button>
                  <Button type="submit" size="sm" disabled={!newSubTitle.trim()}>Add Sub-task</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
