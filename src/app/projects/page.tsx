"use client";

import { useEffect, useState } from "react";
import { useProjectStore, Project, ProjectStatus } from "@/store/use-project-store";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { ProjectCard } from "@/components/projects/project-card";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FolderGit2,
  Plus,
  Search,
  Filter,
  Loader2,
  Sparkles,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

const statusTabs: { value: string; label: string }[] = [
  { value: "all", label: "All Projects" },
  { value: "building", label: "🔨 Building" },
  { value: "deployed", label: "🚀 Deployed" },
  { value: "maintaining", label: "⚡ Maintaining" },
  { value: "archived", label: "📦 Archived" },
];

export default function ProjectsPage() {
  const {
    projects,
    isLoading,
    fetchProjects,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
  } = useProjectStore();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects, statusFilter, searchQuery]);

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsCreateOpen(true);
  };

  const handleCloseDialog = () => {
    setIsCreateOpen(false);
    setEditingProject(null);
  };

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 relative overflow-hidden">
          <div className="space-y-1 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase mb-1">
              <FolderGit2 className="size-3.5" /> Project Diary & Showcase
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Software Development Diary
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              Document your application builds, tech stacks, challenges, and timeline milestones.
            </p>
          </div>

          <Button
            onClick={() => {
              setEditingProject(null);
              setIsCreateOpen(true);
            }}
            size="lg"
            className="rounded-2xl gap-2 shadow-lg shadow-primary/25 shrink-0 font-semibold"
          >
            <Plus className="size-5" /> New Project
          </Button>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card border border-border/50 rounded-2xl p-4 shadow-sm">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {statusTabs.map((tab) => {
              const isActive = statusFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl text-xs"
            />
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : projects.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 px-4 border border-dashed border-border/60 rounded-3xl bg-card/40 space-y-4">
            <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <FolderGit2 className="size-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-lg font-bold">No Projects Found</h3>
              <p className="text-xs text-muted-foreground">
                {searchQuery || statusFilter !== "all"
                  ? "No projects matched your filters. Try clearing search or status filters."
                  : "Start documenting your software journey by adding your first project."}
              </p>
            </div>
            <Button
              onClick={() => {
                setStatusFilter("all");
                setSearchQuery("");
                setIsCreateOpen(true);
              }}
              variant="outline"
              className="rounded-xl gap-2"
            >
              <Plus className="size-4" /> Create First Project
            </Button>
          </div>
        ) : (
          /* Project Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => (
              <ProjectCard
                key={project._id}
                project={project}
                onEdit={handleEditProject}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialog for Create / Edit Project */}
      <CreateProjectDialog
        isOpen={isCreateOpen}
        onClose={handleCloseDialog}
        initialProject={editingProject}
      />
    </PageWrapper>
  );
}
