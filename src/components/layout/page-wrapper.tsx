"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  withContainer?: boolean;
}

/**
 * PageWrapper component to ensure consistent background, foreground, and spacing
 * across all pages in the application. Using Tailwind 4 variables.
 */
export function PageWrapper({
  children,
  className,
  containerClassName,
  withContainer = true,
}: PageWrapperProps) {
  return (
    <div
      className={cn(
        "min-h-screen w-full bg-background text-foreground transition-colors duration-300 ease-in-out selection:bg-primary/20",
        "animate-in fade-in duration-700 ease-in-out",
        className
      )}
    >
      {withContainer ? (
        <main
          className={cn(
            "mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8",
            containerClassName
          )}
        >
          {children}
        </main>
      ) : (
        <main className={containerClassName}>{children}</main>
      )}
    </div>
  );
}
