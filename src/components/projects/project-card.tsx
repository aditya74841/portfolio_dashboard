"use client";

import Link from "next/link";
import { Project, ProjectStatus, useProjectStore } from "@/store/use-project-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  FolderGit2,
  Globe,
  Github,
  Calendar,
  Edit,
  Trash2,
  ArrowRight,
  Sparkles,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
}

const statusConfig: Record<
  ProjectStatus,
  { label: string; color: string; badgeClass: string }
> = {
  building: {
    label: "🔨 Building",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    badgeClass: "bg-amber-500",
  },
  deployed: {
    label: "🚀 Deployed",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    badgeClass: "bg-emerald-500",
  },
  maintaining: {
    label: "⚡ Maintaining",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    badgeClass: "bg-blue-500",
  },
  archived: {
    label: "📦 Archived",
    color: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    badgeClass: "bg-slate-500",
  },
};

export function ProjectCard({ project, onEdit }: ProjectCardProps) {
  const { deleteProject, updateProjectStatus } = useProjectStore();

  const statusInfo = statusConfig[project.status] || statusConfig.building;

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete project "${project.name}" and all its timeline entries?`)) {
      try {
        await deleteProject(project._id);
        toast.success("Project deleted");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to delete";
        toast.error(msg);
      }
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as ProjectStatus;
    try {
      await updateProjectStatus(project._id, newStatus);
      toast.success(`Status updated to ${newStatus}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update status";
      toast.error(msg);
    }
  };

  // Collect all items in tech stack
  const allTechItems = project.techStack.flatMap((cat) => cat.items.map((i) => i.name));

  return (
    <div className="group bg-card border border-border/50 hover:border-primary/40 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
      {/* Decorative gradient blur background */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 size-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors pointer-events-none" />

      <div>
        {/* Header: Name & Status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 className="font-bold text-lg text-foreground tracking-tight group-hover:text-primary transition-colors truncate">
              {project.name}
            </h3>
            <p className="text-xs text-muted-foreground font-mono truncate">/{project.slug}</p>
          </div>

          <span
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 shrink-0",
              statusInfo.color
            )}
          >
            {statusInfo.label}
          </span>
        </div>

        {/* Motive */}
        <p className="text-xs font-medium text-primary/80 italic mb-2 line-clamp-1">
          &ldquo;{project.motive}&rdquo;
        </p>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {project.description}
        </p>

        {/* Tech Stack Badges */}
        {allTechItems.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {allTechItems.slice(0, 5).map((tech, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-lg bg-secondary text-secondary-foreground text-[11px] font-medium border border-border/40"
              >
                {tech}
              </span>
            ))}
            {allTechItems.length > 5 && (
              <span className="px-1.5 py-0.5 rounded-lg bg-muted text-muted-foreground text-[11px] font-medium">
                +{allTechItems.length - 5} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer / Links & Actions */}
      <div className="pt-4 border-t border-border/40 space-y-3">
        <div className="flex items-center justify-between gap-2">
          {/* External Links */}
          <div className="flex items-center gap-2">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"
                title="GitHub Repository"
              >
                <Github className="size-4" />
              </a>
            )}
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-emerald-500 p-1.5 rounded-lg hover:bg-muted transition-colors"
                title="Live Application"
              >
                <Globe className="size-4" />
              </a>
            )}
          </div>

          {/* Quick status switcher */}
          <select
            value={project.status}
            onChange={handleStatusChange}
            className="text-[11px] font-medium bg-muted/60 hover:bg-muted border border-border/40 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
          >
            <option value="building">🔨 Building</option>
            <option value="deployed">🚀 Deployed</option>
            <option value="maintaining">⚡ Maintaining</option>
            <option value="archived">📦 Archived</option>
          </select>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(project)}
              className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
              title="Edit project details"
            >
              <Edit className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="size-8 rounded-lg text-muted-foreground hover:text-destructive"
              title="Delete project"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>

          <Link href={`/projects/${project.slug}`}>
            <Button size="sm" className="rounded-xl gap-1.5 text-xs font-semibold">
              <FolderGit2 className="size-3.5" />
              View Diary
              <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
