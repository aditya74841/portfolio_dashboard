"use client";

import { useState } from "react";
import { useProjectStore, Project, ProjectStatus } from "@/store/use-project-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  FolderPlus,
  Globe,
  Github,
  Sparkles,
  Layers,
  X,
} from "lucide-react";

interface CreateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialProject?: Project | null;
}

export function CreateProjectDialog({
  isOpen,
  onClose,
  initialProject,
}: CreateProjectDialogProps) {
  const { createProject, updateProject } = useProjectStore();

  const [name, setName] = useState(initialProject?.name || "");
  const [slug, setSlug] = useState(initialProject?.slug || "");
  const [description, setDescription] = useState(initialProject?.description || "");
  const [motive, setMotive] = useState(initialProject?.motive || "");
  const [status, setStatus] = useState<ProjectStatus>(initialProject?.status || "building");
  const [githubUrl, setGithubUrl] = useState(initialProject?.githubUrl || "");
  const [liveUrl, setLiveUrl] = useState(initialProject?.liveUrl || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!initialProject) {
      // Auto generate slug
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || !description.trim() || !motive.trim()) {
      toast.error("Please fill in all required fields (Name, Slug, Description, Motive)");
      return;
    }

    setIsSubmitting(true);
    try {
      if (initialProject) {
        await updateProject(initialProject._id, {
          name,
          slug,
          description,
          motive,
          status,
          githubUrl,
          liveUrl,
        });
        toast.success("Project updated successfully");
      } else {
        await createProject({
          name,
          slug,
          description,
          motive,
          status,
          githubUrl,
          liveUrl,
          techStack: [],
        });
        toast.success("Project created successfully");
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Action failed";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border/60 w-full max-w-xl rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted/80 transition-colors"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <FolderPlus className="size-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {initialProject ? "Edit Project" : "Create New Project"}
            </h2>
            <p className="text-xs text-muted-foreground">
              Document your software build journey in your portfolio diary
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Project Name *
            </label>
            <Input
              placeholder="e.g. Kobys POS Dashboard"
              value={name}
              onChange={handleNameChange}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              URL Slug *
            </label>
            <Input
              placeholder="kobys-pos-dashboard"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Development Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full h-10 px-3 py-2 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="building">🔨 Building</option>
                <option value="deployed">🚀 Deployed</option>
                <option value="maintaining">⚡ Maintaining</option>
                <option value="archived">📦 Archived</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Motive / Vision *
              </label>
              <Input
                placeholder="e.g. Modernizing retail point of sale"
                value={motive}
                onChange={(e) => setMotive(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Description *
            </label>
            <Textarea
              placeholder="Brief overview of project features, architecture, and goals..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                <Github className="size-3.5" /> GitHub Repository URL
              </label>
              <Input
                placeholder="https://github.com/username/repo"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                <Globe className="size-3.5" /> Live Demo URL
              </label>
              <Input
                placeholder="https://myproject.com"
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              <Sparkles className="size-4" />
              {isSubmitting
                ? "Saving..."
                : initialProject
                ? "Update Project"
                : "Create Project"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
