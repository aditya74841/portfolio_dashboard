"use client";

import { useEffect, useState } from "react";
import { useIdeaStore, Idea, IdeaStatus } from "@/store/use-idea-store";
import { Sidebar } from "@/components/layout/sidebar";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { IdeaCard } from "@/components/ideas/idea-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Search, 
  Filter, 
  Loader2, 
  Lightbulb,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export default function IdeasPage() {
  const { ideas, isLoading, fetchIdeas, createIdea } = useIdeaStore();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // Create Idea Form State
  const [newIdea, setNewIdea] = useState({ title: "", description: "", status: "idea" as IdeaStatus });

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const filteredIdeas = ideas.filter(idea => 
    idea.title.toLowerCase().includes(search.toLowerCase()) ||
    idea.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createIdea(newIdea);
    setIsCreateOpen(false);
    setNewIdea({ title: "", description: "", status: "idea" });
  };

  const handleIdeaClick = (idea: Idea) => {
    // We'll navigate to detail page or open focus mode
    window.location.href = `/ideas/${idea._id}`;
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden animate-in fade-in duration-500">
      <Sidebar />
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <PageWrapper className="py-8 md:py-12">
          <div className="flex flex-col gap-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Idea Center</h1>
                <p className="text-muted-foreground italic">"Where vision meets execution."</p>
              </div>
              
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-xl shadow-lg shadow-primary/20 gap-2">
                    <Plus className="size-4" />
                    New Idea
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-2xl">
                  <form onSubmit={handleCreate}>
                    <DialogHeader>
                      <DialogTitle>Capture New Idea</DialogTitle>
                      <DialogDescription>
                        Give your vision a title and a brief description to get started.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          placeholder="Project Name / Concept"
                          value={newIdea.title}
                          onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="description">Vision / Description</Label>
                        <Textarea
                          id="description"
                          placeholder="What is this idea about? What problem does it solve?"
                          value={newIdea.description}
                          onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isLoading} className="rounded-xl w-full">
                        {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Save Idea"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-4 bg-card/30 p-2 rounded-2xl border border-border/50 backdrop-blur-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input 
                  placeholder="Search your mind..." 
                  className="pl-10 bg-transparent border-none focus-visible:ring-0"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="h-4 w-px bg-border/50 mx-2" />
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary rounded-xl">
                 <Filter className="size-4" />
                 Filter
              </Button>
            </div>

            {/* Grid */}
            {isLoading && ideas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="size-12 animate-spin text-primary/20" />
                <p className="text-muted-foreground animate-pulse">Syncing your ideas...</p>
              </div>
            ) : filteredIdeas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredIdeas.map((idea) => (
                  <IdeaCard 
                    key={idea._id} 
                    idea={idea} 
                    onClick={handleIdeaClick}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-border/50 rounded-3xl space-y-4">
                <div className="size-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                   <Lightbulb className="size-8" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-lg">No ideas found</h3>
                  <p className="text-muted-foreground">Start by capturing your first great vision.</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="rounded-xl">
                   Capture Idea
                </Button>
              </div>
            )}
          </div>
        </PageWrapper>
      </main>
    </div>
  );
}
