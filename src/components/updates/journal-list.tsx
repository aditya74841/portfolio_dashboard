"use client";

import { useUpdateStore } from "@/store/use-update-store";
import { UpdateCard } from "./update-card";
import { Activity } from "lucide-react";

export function JournalList() {
  const { updates, isLoading } = useUpdateStore();

  if (isLoading && updates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
        <div className="size-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm font-medium">Syncing your journey...</p>
      </div>
    );
  }

  if (updates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center bg-card/20 border border-dashed border-border rounded-3xl gap-4">
        <div className="size-16 rounded-full bg-muted flex items-center justify-center">
          <Activity className="size-8 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-semibold">No entries yet</h3>
          <p className="text-muted-foreground text-sm max-w-[250px]">
            Start your first daily journal entry to see it listed here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {updates.map((update) => (
        <UpdateCard key={update._id} update={update} />
      ))}
    </div>
  );
}
