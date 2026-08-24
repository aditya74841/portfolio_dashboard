"use client";

import { useState } from "react";
import { useProjectStore, ProjectEntry, EntryType } from "@/store/use-project-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Notebook,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Lock,
  Globe,
  X,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateEntryDialogProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  initialEntry?: ProjectEntry | null;
}

const typeOptions: { type: EntryType; label: string; icon: typeof Notebook; color: string }[] = [
  { type: "update", label: "Progress Update", icon: Sparkles, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  { type: "difficulty", label: "Challenge / Bug", icon: AlertTriangle, color: "text-rose-500 bg-rose-500/10 border-rose-500/20" },
  { type: "learning", label: "Key Learning", icon: Lightbulb, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  { type: "milestone", label: "Milestone Reached", icon: CheckCircle2, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
];

export function CreateEntryDialog({
  projectId,
  isOpen,
  onClose,
  initialEntry,
}: CreateEntryDialogProps) {
  const { createEntry, updateEntry } = useProjectStore();

  const [type, setType] = useState<EntryType>(initialEntry?.type || "update");
  const [title, setTitle] = useState(initialEntry?.title || "");
  const [content, setContent] = useState(initialEntry?.content || "");
  const [isPublic, setIsPublic] = useState<boolean>(initialEntry?.isPublic ?? false);
  const [tagInput, setTagInput] = useState(initialEntry?.tags?.join(", ") || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in entry title and content");
      return;
    }

    const formattedTags = tagInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    setIsSubmitting(true);
    try {
      if (initialEntry) {
        await updateEntry(initialEntry._id, {
          type,
          title,
          content,
          isPublic,
          tags: formattedTags,
        });
        toast.success("Timeline entry updated");
      } else {
        await createEntry(projectId, {
          type,
          title,
          content,
          isPublic,
          tags: formattedTags,
        });
        toast.success("New timeline entry posted");
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save entry";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border/60 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted/80 transition-colors"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Notebook className="size-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {initialEntry ? "Edit Timeline Note" : "Add Timeline Note"}
            </h2>
            <p className="text-xs text-muted-foreground">
              Log progress, struggles, learnings, or major project milestones
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Entry Type Selector */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              Entry Type *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {typeOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = type === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setType(opt.type)}
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all text-left",
                      isSelected
                        ? opt.color + " shadow-sm ring-1 ring-primary/30"
                        : "border-border/40 hover:bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Title *
            </label>
            <Input
              placeholder="e.g. Migrated database to Mongoose with compound indexes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Content / Details *
            </label>
            <Textarea
              placeholder="Describe what was accomplished, what went wrong, or what was learned..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Tags (comma-separated)
            </label>
            <Input
              placeholder="mongodb, indexing, performance, bugfix"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
            />
          </div>

          {/* Visibility Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/40">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", isPublic ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-400")}>
                {isPublic ? <Globe className="size-4" /> : <Lock className="size-4" />}
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">
                  {isPublic ? "Public Note" : "Private Note"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {isPublic
                    ? "Visible to visitors on public portfolio website"
                    : "Only visible to you inside dashboard"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                isPublic ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  isPublic ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              <Plus className="size-4" />
              {isSubmitting ? "Saving..." : initialEntry ? "Update Note" : "Post Note"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
