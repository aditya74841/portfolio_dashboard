"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Reusable Error Boundary for wrapping sections of the UI.
 * Prevents a single component failure from crashing the entire page.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in ErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div 
          className={cn(
            "flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-destructive/20 rounded-xl bg-destructive/5 space-y-4",
            this.props.className
          )}
        >
          <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
            <AlertTriangle className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold tracking-tight">Something went wrong here</h3>
            <p className="text-sm text-muted-foreground max-w-[250px]">
              This section failed to load. You can try refreshing it.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={this.handleReset}
            className="h-9 gap-2 border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
          >
            <RefreshCcw className="size-3.5" />
            Retry Section
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
