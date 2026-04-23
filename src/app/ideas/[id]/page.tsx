"use client";

import { useEffect, useState, use } from "react";
import { useIdeaStore, IdeaStatus } from "@/store/use-idea-store";
import { Sidebar } from "@/components/layout/sidebar";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  Plus, 
  Loader2, 
  Calendar, 
  Terminal, 
  Trash2,
  ExternalLink,
  Save,
  Check,
  Activity,
  X
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

const statusVariants: Record<IdeaStatus, "default" | "secondary" | "success" | "warning" | "info" | "destructive"> = {
  idea: "secondary",
  researching: "info",
  building: "warning",
  shipped: "success",
  paused: "destructive"
};

const statuses: IdeaStatus[] = ["idea", "researching", "building", "shipped", "paused"];

export default function IdeaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { currentIdea, isLoading, fetchIdeaById, changeStatus, addUpdate, deleteUpdate, updateIdea, editUpdate } = useIdeaStore();
  const [newUpdate, setNewUpdate] = useState("");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editedDesc, setEditedDesc] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editingUpdateId, setEditingUpdateId] = useState<string | null>(null);
  const [editedUpdateDesc, setEditedUpdateDesc] = useState("");
  const [deleteUpdateId, setDeleteUpdateId] = useState<string | null>(null);

  useEffect(() => {
    fetchIdeaById(id);
  }, [id, fetchIdeaById]);

  useEffect(() => {
    if (currentIdea) {
      setEditedDesc(currentIdea.description);
      setEditedTitle(currentIdea.title);
    }
  }, [currentIdea]);

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpdate.trim()) return;
    await addUpdate(id, newUpdate.trim());
    setNewUpdate("");
  };

  const handleSaveDesc = async () => {
    await updateIdea(id, { description: editedDesc });
    setIsEditingDesc(false);
  };

  const handleSaveTitle = async () => {
    if (!editedTitle.trim()) return;
    await updateIdea(id, { title: editedTitle.trim() });
    setIsEditingTitle(false);
  };

  const handleEditUpdate = (updateId: string, desc: string) => {
    setEditingUpdateId(updateId);
    setEditedUpdateDesc(desc);
  };

  const handleSaveUpdate = async (updateId: string) => {
    if (!editedUpdateDesc.trim()) return;
    await editUpdate(id, updateId, editedUpdateDesc.trim());
    setEditingUpdateId(null);
  };

  const confirmDeleteUpdate = async () => {
    if (deleteUpdateId) {
      await deleteUpdate(id, deleteUpdateId);
      setDeleteUpdateId(null);
    }
  };

  if (!currentIdea && isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentIdea) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <h2 className="text-xl font-bold">Idea not found</h2>
        <Button asChild variant="outline">
          <Link href="/ideas">Return to Gallery</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden animate-in fade-in duration-500">
      <Sidebar />
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <PageWrapper className="py-8 md:py-12">
          <div className="max-w-5xl mx-auto flex flex-col gap-8">
            {/* Navigation & Header */}
            <div className="flex flex-col gap-4">
               <Link href="/ideas" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors w-fit">
                  <ArrowLeft className="size-4" />
                  Back to Ideas
               </Link>
               
               <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="space-y-2 flex-1">
                    {isEditingTitle ? (
                      <div className="flex items-center gap-2">
                        <Input 
                          value={editedTitle} 
                          onChange={(e) => setEditedTitle(e.target.value)}
                          className="text-3xl font-bold h-auto py-1 px-2 border-primary/30"
                          autoFocus
                        />
                        <Button size="icon" onClick={handleSaveTitle} className="rounded-xl shrink-0"><Check className="size-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setIsEditingTitle(false)} className="rounded-xl shrink-0"><X className="size-4" /></Button>
                      </div>
                    ) : (
                      <h1 className="text-4xl font-bold tracking-tight group flex items-center gap-2">
                        {currentIdea.title}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setIsEditingTitle(true)}
                          className="opacity-0 group-hover:opacity-100 size-8 rounded-xl"
                        >
                          <Terminal className="size-4" />
                        </Button>
                      </h1>
                    )}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {statuses.map((s) => (
                        <button
                          key={s}
                          onClick={() => changeStatus(id, s)}
                          className={cn(
                            "transition-all",
                            currentIdea.status === s ? "scale-105" : "opacity-30 hover:opacity-100 grayscale hover:grayscale-0"
                          )}
                        >
                          <Badge variant={statusVariants[s]} className="capitalize px-3 py-1 cursor-pointer">
                            {s}
                            {currentIdea.status === s && <Check className="ml-1.5 size-3" />}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground bg-muted/30 px-4 py-2 rounded-xl border border-border/50">
                     Created: {new Date(currentIdea.createdAt).toLocaleDateString()}
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Description & Strategy */}
              <div className="lg:col-span-2 space-y-6">
                <div className="group relative bg-card/30 rounded-3xl border border-border/50 p-8 min-h-[300px]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Terminal className="size-5 text-primary" />
                        The Vision
                    </h2>
                    {isEditingDesc ? (
                       <Button onClick={handleSaveDesc} size="sm" className="rounded-xl gap-2">
                          <Save className="size-4" />
                          Save
                       </Button>
                    ) : (
                       <Button onClick={() => setIsEditingDesc(true)} variant="ghost" size="sm" className="rounded-xl text-primary opacity-0 group-hover:opacity-100">
                          Edit
                       </Button>
                    )}
                  </div>
                  
                  {isEditingDesc ? (
                    <Textarea 
                      value={editedDesc}
                      onChange={(e) => setEditedDesc(e.target.value)}
                      className="min-h-[250px] text-lg leading-relaxed bg-background/50"
                      autoFocus
                    />
                  ) : (
                    <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-wrap">
                      {currentIdea.description}
                    </p>
                  )}
                </div>

                <div className="bg-primary/5 rounded-3xl border border-primary/10 p-8 italic text-primary/80">
                   "Ideas are cheap. Execution is everything. Use the timeline on the right to track every small win."
                </div>
              </div>

              {/* Right Column: Timeline / Updates */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Activity className="size-5 text-primary" />
                      Changelog
                   </h2>
                </div>

                {/* Add Update Form */}
                <form onSubmit={handleAddUpdate} className="space-y-3">
                  <Textarea 
                    placeholder="Log a small win or progress update..."
                    value={newUpdate}
                    onChange={(e) => setNewUpdate(e.target.value)}
                    className="rounded-2xl border-primary/20 bg-primary/5 focus-visible:ring-primary/20 min-h-[100px]"
                  />
                  <Button type="submit" disabled={!newUpdate.trim() || isLoading} className="w-full rounded-2xl gap-2 hover:shadow-lg transition-all">
                    {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                    Add Entry
                  </Button>
                </form>

                {/* Timeline Feed */}
                <div className="relative space-y-8 pl-4 pt-4 border-l border-border/50 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {currentIdea.updates.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground italic text-sm">
                       Quiet for now... add your first update.
                    </div>
                  ) : (
                    currentIdea.updates.map((update, idx) => (
                      <div key={update._id} className="relative group">
                        {/* Dot */}
                        <div className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-primary border-4 border-background" />
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                                <Calendar className="size-3" />
                                {new Date(update.createdAt).toLocaleDateString()}
                             </div>
                             <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleEditUpdate(update._id, update.description)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                                >
                                   <Terminal className="size-3" />
                                </button>
                                <button 
                                  onClick={() => setDeleteUpdateId(update._id)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:scale-110"
                                >
                                   <X className="size-3" />
                                </button>
                             </div>
                          </div>
                          
                          {editingUpdateId === update._id ? (
                            <div className="space-y-2">
                               <Textarea 
                                 value={editedUpdateDesc}
                                 onChange={(e) => setEditedUpdateDesc(e.target.value)}
                                 className="min-h-[80px] bg-background/50"
                               />
                               <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleSaveUpdate(update._id)} className="rounded-xl h-8 px-3">Save</Button>
                                  <Button size="sm" variant="ghost" onClick={() => setEditingUpdateId(null)} className="rounded-xl h-8 px-3">Cancel</Button>
                               </div>
                            </div>
                          ) : (
                            <p className="text-sm leading-relaxed border bg-card/20 p-3 rounded-2xl border-border/50">
                              {update.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </PageWrapper>
      </main>
      <ConfirmDeleteDialog
        open={!!deleteUpdateId}
        onOpenChange={(open) => !open && setDeleteUpdateId(null)}
        onConfirm={confirmDeleteUpdate}
        title="Remove Log Entry?"
        description="This action will permanently delete this progress update from the timeline."
      />
    </div>
  );
}
