"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { useUpdateStore } from "@/store/use-update-store";
import { LoginScreen } from "@/components/auth/login-screen";
import { Sidebar } from "@/components/layout/sidebar";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Button } from "@/components/ui/button";
import { Plus, Settings2, RefreshCcw } from "lucide-react";
import { JournalList } from "@/components/updates/journal-list";
import { TemplateManager } from "@/components/updates/template-manager";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function UpdatesPage() {
  const { isAuthenticated } = useAuthStore();
  const { fetchUpdates, fetchActiveTemplate, createUpdate, isLoading } = useUpdateStore();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  
  const [newTitle, setNewTitle] = useState("Daily Journal");
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUpdates();
      fetchActiveTemplate();
    }
  }, [isAuthenticated, fetchUpdates, fetchActiveTemplate]);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const handleCreate = async () => {
    await createUpdate({ title: newTitle, date: newDate });
    setIsCreateDialogOpen(false);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden animate-in fade-in duration-700">
      <Sidebar />
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <PageWrapper className="py-8 md:py-12">
          <div className="flex flex-col gap-8 max-w-5xl mx-auto">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Daily Journal</h1>
                <p className="text-muted-foreground">Document your journey, one day at a time.</p>
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => setShowTemplates(!showTemplates)}
                >
                  <Settings2 className="size-4" />
                  {showTemplates ? "View Journal" : "Master Questions"}
                </Button>
                
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 shadow-lg shadow-primary/20">
                      <Plus className="size-4" />
                      Start Today
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] border-border/50 bg-card/95 backdrop-blur-xl">
                    <DialogHeader>
                      <DialogTitle>New Journal Entry</DialogTitle>
                      <DialogDescription>
                        Create a new entry for today or a specific date.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="date">Date</Label>
                        <Input 
                          id="date" 
                          type="date" 
                          value={newDate} 
                          onChange={(e) => setNewDate(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input 
                          id="title" 
                          placeholder="Daily Journal" 
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleCreate}>Initialize Entry</Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button variant="ghost" size="icon" onClick={() => fetchUpdates()} disabled={isLoading}>
                  <RefreshCcw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </header>

            {/* Content Area */}
            {showTemplates ? (
              <TemplateManager />
            ) : (
              <JournalList />
            )}
          </div>
        </PageWrapper>
      </main>
    </div>
  );
}
