"use client";

import { Idea, IdeaStatus, useIdeaStore } from "@/store/use-idea-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Trash2, 
  ExternalLink, 
  Clock, 
  MessageSquare,
  ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { useState } from "react";

function relativeTime(date: Date) {
  const diff = Math.round((date.getTime() - Date.now()) / 1000);
  const minutes = Math.round(diff / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (Math.abs(diff) < 60) return "just now";
  if (Math.abs(minutes) < 60) return `${Math.abs(minutes)}m ago`;
  if (Math.abs(hours) < 24) return `${Math.abs(hours)}h ago`;
  return `${Math.abs(days)}d ago`;
}

interface IdeaCardProps {
  idea: Idea;
  onClick: (idea: Idea) => void;
}

const statusVariants: Record<IdeaStatus, "default" | "secondary" | "success" | "warning" | "info" | "destructive"> = {
  idea: "secondary",
  researching: "info",
  building: "warning",
  shipped: "success",
  paused: "destructive"
};

export function IdeaCard({ idea, onClick }: IdeaCardProps) {
  const { deleteIdea } = useIdeaStore();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    await deleteIdea(idea._id);
  };

  return (
    <Card 
      onClick={() => onClick(idea)}
      className="group cursor-pointer border-border/50 bg-card/50 hover:border-primary/30 hover:shadow-md transition-all animate-in fade-in zoom-in duration-300"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Badge variant={statusVariants[idea.status]} className="capitalize">
            {idea.status}
          </Badge>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              variant="ghost" 
              size="icon" 
              className="size-7 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
        <CardTitle className="text-xl line-clamp-1 mt-3 group-hover:text-primary transition-colors">
          {idea.title}
        </CardTitle>
        <CardDescription className="line-clamp-2 min-h-[2.5rem]">
          {idea.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground font-medium pt-4 border-t border-border/30">
          <div className="flex items-center gap-1.5">
            <Clock className="size-3" />
            <span>{relativeTime(new Date(idea.updatedAt))}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageSquare className="size-3" />
            <span>{idea.updates.length} Updates</span>
          </div>
        </div>
      </CardContent>
      <div onClick={(e) => e.stopPropagation()}>
        <ConfirmDeleteDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={confirmDelete}
          itemName={idea.title}
          title="Discard Idea?"
          description="This will permanently remove this idea and all of its logged progress."
        />
      </div>
    </Card>
  );
}
