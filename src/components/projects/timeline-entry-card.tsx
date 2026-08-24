"use client";

import { useState } from "react";
import { ProjectEntry, EntryType, useProjectStore } from "@/store/use-project-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Notebook,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Lock,
  Globe,
  Tag,
  Trash2,
  Edit,
  Plus,
  X,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineEntryCardProps {
  entry: ProjectEntry;
  onEdit: (entry: ProjectEntry) => void;
}

const typeConfig: Record<
  EntryType,
  { label: string; icon: typeof Notebook; color: string; border: string }
> = {
  update: {
    label: "Progress Update",
    icon: Sparkles,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    border: "border-l-blue-500",
  },
  difficulty: {
    label: "Challenge / Bug",
    icon: AlertTriangle,
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    border: "border-l-rose-500",
  },
  learning: {
    label: "Key Learning",
    icon: Lightbulb,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    border: "border-l-amber-500",
  },
  milestone: {
    label: "Milestone",
    icon: CheckCircle2,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    border: "border-l-emerald-500",
  },
};

export function TimelineEntryCard({ entry, onEdit }: TimelineEntryCardProps) {
  const { deleteEntry, toggleEntryVisibility, addEntryTags, removeEntryTag } =
    useProjectStore();

  const [newTagInput, setNewTagInput] = useState("");
  const [showAddTag, setShowAddTag] = useState(false);

  const config = typeConfig[entry.type] || typeConfig.update;
  const TypeIcon = config.icon;

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this timeline note?")) {
      try {
        await deleteEntry(entry._id);
        toast.success("Note deleted");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to delete";
        toast.error(msg);
      }
    }
  };

  const handleToggleVisibility = async () => {
    try {
      await toggleEntryVisibility(entry._id, !entry.isPublic);
      toast.success(
        !entry.isPublic ? "Note is now public on portfolio" : "Note is now private"
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to change visibility";
      toast.error(msg);
    }
  };

  const handleAddTagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim()) return;

    try {
      await addEntryTags(entry._id, [newTagInput.trim()]);
      setNewTagInput("");
      setShowAddTag(false);
      toast.success("Tag added");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add tag";
      toast.error(msg);
    }
  };

  const handleRemoveTag = async (tag: string) => {
    try {
      await removeEntryTag(entry._id, tag);
      toast.success(`Removed tag "${tag}"`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove tag";
      toast.error(msg);
    }
  };

  const formattedDate = new Date(entry.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className={cn(
        "bg-card border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all border-l-4 relative group",
        config.border
      )}
    >
      {/* Header Info */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5",
              config.color
            )}
          >
            <TypeIcon className="size-3.5" />
            {config.label}
          </span>

          <button
            onClick={handleToggleVisibility}
            className={cn(
              "px-2 py-0.5 rounded-full text-[11px] font-medium border flex items-center gap-1 transition-colors",
              entry.isPublic
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20"
                : "bg-slate-500/10 text-slate-500 border-slate-500/20 hover:bg-slate-500/20"
            )}
            title="Click to toggle public / private status"
          >
            {entry.isPublic ? <Globe className="size-3" /> : <Lock className="size-3" />}
            {entry.isPublic ? "Public" : "Private"}
          </button>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="size-3.5" />
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* Title */}
      <h4 className="font-bold text-base text-foreground mb-2">{entry.title}</h4>

      {/* Content */}
      <p className="text-sm text-muted-foreground whitespace-pre-line mb-4 leading-relaxed">
        {entry.content}
      </p>

      {/* Tags & Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/40">
        {/* Tags list */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {entry.tags.map((tag, idx) => (
            <span
              key={idx}
              className="group/tag inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-secondary text-secondary-foreground text-[11px] font-medium border border-border/40"
            >
              <Tag className="size-3 text-muted-foreground" />
              #{tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="opacity-0 group-hover/tag:opacity-100 hover:text-destructive transition-opacity"
                title="Remove tag"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}

          {showAddTag ? (
            <form onSubmit={handleAddTagSubmit} className="flex items-center gap-1">
              <Input
                placeholder="tag name"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                className="h-6 text-xs w-24 px-1.5 py-0"
                autoFocus
              />
              <Button type="submit" size="icon" className="size-6">
                <Plus className="size-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowAddTag(false)}
                className="size-6 text-muted-foreground"
              >
                <X className="size-3" />
              </Button>
            </form>
          ) : (
            <button
              onClick={() => setShowAddTag(true)}
              className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-muted transition-colors"
            >
              <Plus className="size-3" /> Tag
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(entry)}
            className="size-7 text-muted-foreground hover:text-foreground"
            title="Edit note"
          >
            <Edit className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="size-7 text-muted-foreground hover:text-destructive"
            title="Delete note"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
