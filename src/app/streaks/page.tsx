"use client";

import { useEffect, useState } from "react";
import { useStreakStore } from "@/store/use-streak-store";
import { Plus, Check, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";

import { StreakHeatmap } from "@/components/streaks/heatmap";

import { Sidebar } from "@/components/layout/sidebar";
import { PageWrapper } from "@/components/layout/page-wrapper";

export default function StreaksPage() {
  const { streaks, isLoading, error, fetchStreaks, createStreak, markStreakComplete, deleteStreak } = useStreakStore();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newStreakName, setNewStreakName] = useState("");
  const [newStreakDesc, setNewStreakDesc] = useState("");

  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [activeStreakId, setActiveStreakId] = useState<string | null>(null);
  const [streakNote, setStreakNote] = useState("");

  useEffect(() => {
    fetchStreaks();
  }, [fetchStreaks]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreakName) return;
    await createStreak(newStreakName, newStreakDesc);
    setIsCreateOpen(false);
    setNewStreakName("");
    setNewStreakDesc("");
  };

  const handleCompleteClick = (id: string) => {
    setActiveStreakId(id);
    setIsCompleteOpen(true);
    setStreakNote("");
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStreakId) return;
    
    const streak = streaks.find(s => s._id === activeStreakId);
    if (!streak) return;
    
    const nextValue = streak.currentStreak + 1;
    
    await markStreakComplete(activeStreakId, nextValue, streakNote);
    setIsCompleteOpen(false);
    setActiveStreakId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this streak?")) {
      await deleteStreak(id);
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden animate-in fade-in duration-500">
      <Sidebar />
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <PageWrapper className="py-8 md:py-12">
          <div className="flex flex-col gap-8 max-w-6xl mx-auto px-4">
            
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
                  My Streaks
                </h1>
                <p className="text-muted-foreground text-lg mt-1">Track your daily habits and build momentum.</p>
              </div>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
              >
                <Plus className="w-5 h-5" />
                New Streak
              </button>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive p-4 rounded-lg border border-destructive/20">
                {error}
              </div>
            )}

            {isLoading && streaks.length === 0 ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              </div>
            ) : streaks.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-xl border border-border shadow-sm">
                <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">No active streaks</h3>
                <p className="text-muted-foreground mt-2 mb-6">Start building good habits today by creating a streak.</p>
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Create Your First Streak
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {streaks.map((streak) => {
                  const isCompletedToday = streak.lastCompletedDate 
                    ? new Date(streak.lastCompletedDate).toDateString() === new Date().toDateString()
                    : false;

                  return (
                    <div key={streak._id} className="bg-card rounded-xl border border-border p-6 flex flex-col relative group shadow-sm hover:shadow-md transition-shadow">
                      <button 
                        onClick={() => handleDelete(streak._id)}
                        className="absolute top-4 right-4 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      
                      <h3 className="text-xl font-bold mb-2 pr-8 text-foreground">{streak.name}</h3>
                      <p className="text-muted-foreground text-sm mb-6 flex-grow">{streak.description || "No description provided."}</p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-secondary/50 p-3 rounded-lg text-center border border-border/50">
                          <div className="text-3xl font-bold text-indigo-500">{streak.currentStreak}</div>
                          <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Current</div>
                        </div>
                        <div className="bg-secondary/50 p-3 rounded-lg text-center border border-border/50">
                          <div className="text-3xl font-bold text-emerald-500">{streak.longestStreak}</div>
                          <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Longest</div>
                        </div>
                      </div>

                      {isCompletedToday ? (
                        <div className="flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 py-3 rounded-lg border border-emerald-500/20 font-medium">
                          <Check className="w-5 h-5" />
                          <span>Completed Today</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleCompleteClick(streak._id)}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition-colors"
                        >
                          Mark Complete for Today
                        </button>
                      )}

                      <StreakHeatmap logs={streak.streakNumber || []} />
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </PageWrapper>
      </main>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-xl border border-border p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Create New Streak</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Streak Name</label>
                <input
                  type="text"
                  value={newStreakName}
                  onChange={(e) => setNewStreakName(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  placeholder="e.g. Meditate for 10 mins"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Description (Optional)</label>
                <textarea
                  value={newStreakDesc}
                  onChange={(e) => setNewStreakDesc(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
                  placeholder="Why are you starting this streak?"
                  rows={3}
                />
              </div>
              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !newStreakName}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
                >
                  {isLoading ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {isCompleteOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-xl border border-border p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Complete Streak</h2>
            <form onSubmit={handleCompleteSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Daily Note / Journal</label>
                <textarea
                  value={streakNote}
                  onChange={(e) => setStreakNote(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
                  placeholder="How did it go today? (Optional)"
                  rows={4}
                />
              </div>
              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setIsCompleteOpen(false)}
                  className="flex-1 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg transition-colors flex justify-center items-center gap-2 font-medium"
                >
                  {isLoading ? "Saving..." : (
                    <>
                      <Check className="w-5 h-5" /> Mark Complete
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
