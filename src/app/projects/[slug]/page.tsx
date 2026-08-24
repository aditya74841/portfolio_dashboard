"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useProjectStore, ProjectEntry, EntryType } from "@/store/use-project-store";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { TimelineEntryCard } from "@/components/projects/timeline-entry-card";
import { CreateEntryDialog } from "@/components/projects/create-entry-dialog";
import { TechStackManager } from "@/components/projects/tech-stack-manager";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  FolderGit2,
  Globe,
  Github,
  Plus,
  Loader2,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Layers,
  Notebook,
} from "lucide-react";
import { cn } from "@/lib/utils";

const typeFilterOptions: { value: string; label: string }[] = [
  { value: "all", label: "All Notes" },
  { value: "update", label: "✨ Progress Updates" },
  { value: "difficulty", label: "⚠️ Challenges & Bugs" },
  { value: "learning", label: "💡 Learnings" },
  { value: "milestone", label: "🎯 Milestones" },
];

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const {
    activeProject,
    fetchProjectBySlug,
    entries,
    isEntriesLoading,
    fetchEntries,
    entryTypeFilter,
    setEntryTypeFilter,
    isLoading,
  } = useProjectStore();

  const [activeTab, setActiveTab] = useState<"timeline" | "techstack">("timeline");
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ProjectEntry | null>(null);

  useEffect(() => {
    if (slug) {
      fetchProjectBySlug(slug).then((proj) => {
        if (proj) {
          fetchEntries(proj._id);
        }
      });
    }
  }, [slug, fetchProjectBySlug, fetchEntries, entryTypeFilter]);

  const handleEditEntry = (entry: ProjectEntry) => {
    setEditingEntry(entry);
    setIsEntryDialogOpen(true);
  };

  const handleCloseEntryDialog = () => {
    setIsEntryDialogOpen(false);
    setEditingEntry(null);
  };

  if (isLoading && !activeProject) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </PageWrapper>
    );
  }

  if (!activeProject) {
    return (
      <PageWrapper>
        <div className="text-center py-20 space-y-4">
          <h2 className="text-xl font-bold">Project Not Found</h2>
          <p className="text-sm text-muted-foreground">
            Could not locate project with slug &quot;{slug}&quot;.
          </p>
          <Link href="/projects">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="size-4" /> Back to Projects
            </Button>
          </Link>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Navigation back link */}
        <div>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="size-4" /> Back to Projects List
          </Link>
        </div>

        {/* Project Header */}
        <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm space-y-4 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                  {activeProject.name}
                </h1>
                <span className="text-xs font-mono px-2 py-0.5 rounded-lg bg-muted text-muted-foreground border">
                  /{activeProject.slug}
                </span>
              </div>
              <p className="text-sm font-medium text-primary italic">
                &ldquo;{activeProject.motive}&rdquo;
              </p>
            </div>

            {/* External Links */}
            <div className="flex items-center gap-2 shrink-0">
              {activeProject.githubUrl && (
                <a
                  href={activeProject.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/50 text-xs font-semibold hover:bg-muted transition-colors"
                >
                  <Github className="size-4" /> GitHub
                </a>
              )}
              {activeProject.liveUrl && (
                <a
                  href={activeProject.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
                >
                  <Globe className="size-4" /> Live App
                </a>
              )}
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {activeProject.description}
          </p>

          {/* Section Navigation Tabs */}
          <div className="flex items-center gap-2 pt-2 border-t border-border/40">
            <button
              onClick={() => setActiveTab("timeline")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                activeTab === "timeline"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Notebook className="size-4" /> Timeline Notes ({entries.length})
            </button>
            <button
              onClick={() => setActiveTab("techstack")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                activeTab === "techstack"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Layers className="size-4" /> Tech Architecture ({activeProject.techStack.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Timeline Feed */}
        {activeTab === "timeline" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border/50 rounded-2xl p-4 shadow-sm">
              {/* Type Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {typeFilterOptions.map((opt) => {
                  const isActive = entryTypeFilter === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setEntryTypeFilter(opt.value);
                        fetchEntries(activeProject._id, { type: opt.value });
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <Button
                onClick={() => {
                  setEditingEntry(null);
                  setIsEntryDialogOpen(true);
                }}
                className="gap-2 rounded-xl text-xs font-semibold shrink-0"
              >
                <Plus className="size-4" /> Add Timeline Note
              </Button>
            </div>

            {/* Timeline Notes List */}
            {isEntriesLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-16 px-4 border border-dashed border-border/60 rounded-3xl bg-card/40 space-y-3">
                <Notebook className="size-8 text-muted-foreground/40 mx-auto" />
                <h3 className="text-base font-bold">No Timeline Notes Yet</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Add progress updates, difficulties encountered, or milestones achieved during build.
                </p>
                <Button
                  onClick={() => setIsEntryDialogOpen(true)}
                  variant="outline"
                  className="rounded-xl gap-2 text-xs"
                >
                  <Plus className="size-4" /> Post First Note
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {entries.map((entry) => (
                  <TimelineEntryCard
                    key={entry._id}
                    entry={entry}
                    onEdit={handleEditEntry}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Tech Stack Manager */}
        {activeTab === "techstack" && (
          <TechStackManager project={activeProject} />
        )}
      </div>

      {/* Entry Creation / Edit Dialog */}
      <CreateEntryDialog
        projectId={activeProject._id}
        isOpen={isEntryDialogOpen}
        onClose={handleCloseEntryDialog}
        initialEntry={editingEntry}
      />
    </PageWrapper>
  );
}
