import { Loader2 } from "lucide-react";

/**
 * Segment-level loading component for Next.js App Router.
 * Provides a consistent UI during navigation transitions.
 */
export default function Loading() {
  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
      <div className="relative flex items-center justify-center">
        <Loader2 className="size-10 animate-spin text-primary/40" />
        <div className="absolute size-4 bg-primary rounded-full animate-pulse shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-sm font-medium tracking-tight">Initializing Template...</p>
        <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">Please wait</p>
      </div>
    </div>
  );
}
