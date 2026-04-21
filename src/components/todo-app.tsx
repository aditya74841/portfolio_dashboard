"use client";

import { useEffect, useState } from "react";
import { useTodoStore } from "@/store/use-todo-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash2, AlertCircle, Check } from "lucide-react";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { cn } from "@/lib/utils";

/**
 * TodoApp component demonstrating Zustand CRUD and Error Boundary integration.
 */
export function TodoApp() {
  const { todos, isLoading, error, fetchTodos, addTodo, toggleTodo, deleteTodo } = useTodoStore();
  const [newTodoTitle, setNewTodoTitle] = useState("");

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;
    await addTodo(newTodoTitle.trim());
    setNewTodoTitle("");
  };

  return (
    <ErrorBoundary className="w-full max-w-md mx-auto">
      <Card className="shadow-lg border-primary/10">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            Tasks
            {isLoading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          </CardTitle>
          <CardDescription>
            Manage your daily tasks with Zustand CRUD logic.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Todo Form */}
          <form onSubmit={handleAddTodo} className="flex gap-2">
            <Input
              placeholder="What needs to be done?"
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isLoading || !newTodoTitle.trim()}>
              <Plus className="size-4" />
            </Button>
          </form>

          {/* Error State */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="size-4" />
              {error}
              <Button variant="ghost" size="sm" onClick={() => fetchTodos()} className="ml-auto h-auto p-0">
                Retry
              </Button>
            </div>
          )}

          {/* List Wrapper */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
            {todos.length === 0 && !isLoading && !error && (
              <p className="text-center py-8 text-muted-foreground italic">
                No tasks found. Add one above!
              </p>
            )}

            {todos.map((todo) => (
              <div
                key={todo.id}
                className="group flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card hover:border-primary/20 hover:bg-accent/5 transition-all animate-in fade-in slide-in-from-left-2 duration-300"
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleTodo(todo.id)}
                    className={cn(
                      "size-5 rounded border border-primary/30 flex items-center justify-center transition-all",
                      todo.completed ? "bg-primary border-primary text-primary-foreground" : "bg-transparent"
                    )}
                  >
                    {todo.completed && <Check className="size-3.5 stroke-[3]" />}
                  </button>
                  <span className={cn(
                    "text-sm transition-all duration-300",
                    todo.completed ? "line-through text-muted-foreground italic" : "text-foreground"
                  )}>
                    {todo.title}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteTodo(todo.id)}
                  className="size-8 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}

            {isLoading && todos.length === 0 && (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 w-full bg-muted/30 rounded-lg animate-pulse" />
                ))}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground flex justify-between border-t pt-4">
          <span>{todos.filter(t => !t.completed).length} items left</span>
          <span>Zustand + Shadcn UI</span>
        </CardFooter>
      </Card>
    </ErrorBoundary>
  );
}
