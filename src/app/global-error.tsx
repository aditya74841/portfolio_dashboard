"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";

/**
 * Root Error Boundary for the entire application.
 * catches errors in the root layout or global providers.
 * Must include <html> and <body> tags since it replaces the root layout.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Critical Global Error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center p-4 text-center bg-background text-foreground antialiased font-sans">
        <div className="flex flex-col items-center gap-6 max-w-md animate-in fade-in zoom-in duration-500">
          <div className="size-20 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
            <AlertCircle className="size-10" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">System Failure</h2>
            <p className="text-muted-foreground">
              A critical system error occurred. We are unable to provide a recovery path inside the application.
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full sm:w-auto">
            <Button 
              onClick={() => reset()}
              className="gap-2 h-11 px-8 rounded-full"
            >
              <RefreshCcw className="size-4" />
              Reset System
            </Button>
            <Button variant="ghost" onClick={() => window.location.reload()}>
              Force Reload Page
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
