"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  useDiaryStore,
  DiaryEntry,
  getTodayDateString,
  shiftDateString,
} from "@/store/use-diary-store";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Save,
  Trash2,
  Loader2,
  Sparkles,
  Smile,
  BookMarked,
  Clock,
  Search,
  Check,
  Copy,
  Lightbulb,
  Maximize2,
  Minimize2
} from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Dynamically import Quill to avoid SSR issues
const QuillEditor = dynamic(
  () => import("@/components/notes/QuillEditor").then((m) => m.QuillEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center p-12">
        <Loader2 className="size-6 animate-spin text-primary/60" />
      </div>
    ),
  }
);

const MOOD_OPTIONS = [
  { label: "Neutral", emoji: "😐" },
  { label: "Great", emoji: "😊" },
  { label: "Productive", emoji: "🎯" },
  { label: "Calm", emoji: "🌿" },
  { label: "Energetic", emoji: "⚡" },
  { label: "Tired", emoji: "😴" },
];

const WRITING_PROMPTS = [
  "What is 1 thing that made you smile or feel grateful today?",
  "What was your biggest accomplishment or win today?",
  "What challenged you today, and how did you handle it?",
  "What is a key lesson you learned today?",
  "What are your top 3 priorities for tomorrow?",
  "Describe a moment today when you felt focused and in the flow.",
  "What is something you can do tomorrow to take better care of yourself?",
];

const AUTO_SAVE_DELAY = 3000;

function formatDisplayDate(dateStr: string): string {
  try {
    const parsed = parseISO(dateStr);
    if (isValid(parsed)) {
      return format(parsed, "EEEE, MMMM d, yyyy");
    }
  } catch {
    // Fallback
  }
  return dateStr;
}

function stripHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export default function DiaryPage() {
  const {
    entries,
    activeEntry,
    selectedDate,
    isLoading,
    isSaving,
    fetchTodayEntry,
    fetchEntryByDate,
    fetchEntries,
    saveEntry,
    deleteEntry,
  } = useDiaryStore();

  const [content, setContent] = useState("");
  const [mood, setMood] = useState("Neutral");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevDateRef = useRef<string | null>(null);
  const isSavingRef = useRef(false);

  // Initial load
  useEffect(() => {
    fetchTodayEntry();
    fetchEntries();
  }, [fetchTodayEntry, fetchEntries]);

  // Sync editor state when selected activeEntry or date changes
  useEffect(() => {
    if (selectedDate !== prevDateRef.current) {
      if (activeEntry && activeEntry.date === selectedDate) {
        setContent(activeEntry.content || "");
        setMood(activeEntry.mood || "Neutral");
      } else {
        setContent("");
        setMood("Neutral");
      }
      setHasUnsavedChanges(false);
      setLastSaved(null);
      prevDateRef.current = selectedDate;
    } else if (activeEntry && activeEntry.date === selectedDate && !hasUnsavedChanges) {
      setContent(activeEntry.content || "");
      setMood(activeEntry.mood || "Neutral");
    }
  }, [activeEntry, selectedDate, hasUnsavedChanges]);

  // Cleanup auto-save timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, []);

  // Filter archived entries in sidebar
  const filteredEntries = useMemo(() => {
    let list = entries || [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.date.includes(q) ||
          e.content.toLowerCase().includes(q) ||
          e.mood.toLowerCase().includes(q)
      );
    }
    return list;
  }, [entries, searchQuery]);

  // Save handler
  const handleSave = useCallback(
    async (currentContent: string, currentMood: string) => {
      if (isSavingRef.current) return;

      isSavingRef.current = true;
      try {
        await saveEntry(selectedDate, currentContent, currentMood);
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
      } finally {
        isSavingRef.current = false;
      }
    },
    [selectedDate, saveEntry]
  );

  const handleSaveRef = useRef(handleSave);
  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  const scheduleAutoSave = useCallback((newContent: string, newMood: string) => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      handleSaveRef.current(newContent, newMood);
    }, AUTO_SAVE_DELAY);
  }, []);

  const handleContentChange = (value: string) => {
    setContent(value);
    setHasUnsavedChanges(true);
    scheduleAutoSave(value, mood);
  };

  const handleMoodSelect = (newMood: string) => {
    setMood(newMood);
    setHasUnsavedChanges(true);
    scheduleAutoSave(content, newMood);
  };

  const handleSelectDate = async (dateStr: string) => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    if (hasUnsavedChanges) await handleSave(content, mood);
    fetchEntryByDate(dateStr);
  };

  const handleGoToday = () => {
    const todayStr = getTodayDateString();
    handleSelectDate(todayStr);
  };

  const handlePrevDay = () => {
    const prevDate = shiftDateString(selectedDate, -1);
    handleSelectDate(prevDate);
  };

  const handleNextDay = () => {
    const nextDate = shiftDateString(selectedDate, 1);
    handleSelectDate(nextDate);
  };

  const handleInsertPrompt = () => {
    const prompt = WRITING_PROMPTS[currentPromptIndex];
    const formattedPrompt = `<p><strong>💡 Reflection Prompt:</strong> <em>${prompt}</em></p><p><br></p>`;
    const updatedContent = content ? content + formattedPrompt : formattedPrompt;
    handleContentChange(updatedContent);
    setCurrentPromptIndex((prev) => (prev + 1) % WRITING_PROMPTS.length);
    toast.success("Writing prompt added!");
  };

  const handleCopyText = async () => {
    const plain = stripHtml(content);
    if (!plain.trim()) return;

    try {
      await navigator.clipboard.writeText(plain);
      setIsCopied(true);
      toast.success("Diary entry copied to clipboard!");
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error("Failed to copy text.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (activeEntry?._id) {
      await deleteEntry(activeEntry._id);
      setContent("");
      setMood("Neutral");
      setShowDeleteDialog(false);
    }
  };

  const todayStr = getTodayDateString();
  const isToday = selectedDate === todayStr;

  const plainText = useMemo(() => stripHtml(content), [content]);
  const wordCount = useMemo(() => (plainText ? plainText.split(/\s+/).filter(Boolean).length : 0), [plainText]);
  const readTimeMinutes = useMemo(() => Math.max(1, Math.ceil(wordCount / 200)), [wordCount]);

  return (
    <div className="flex h-[100dvh] bg-background overflow-hidden select-none">
      <Sidebar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col p-2 md:p-4 lg:p-6 gap-3 md:gap-4 h-[100dvh] overflow-hidden bg-gradient-to-br from-background via-background to-muted/30">
        
        {/* Workspace Body */}
        <div className="flex-1 flex gap-3 md:gap-5 min-h-0 overflow-hidden">
          
          {/* Left Archive Sidebar */}
          <aside
            className={cn(
              "flex-col bg-card/70 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl w-72 lg:w-80 h-full shrink-0 overflow-hidden transition-all",
              isFocusMode ? "hidden" : "hidden md:flex"
            )}
          >
            {/* Header */}
            <div className="p-3.5 border-b border-border/40 space-y-2.5 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <BookMarked className="size-4" />
                  </div>
                  <h2 className="text-xs font-bold tracking-tight text-foreground">
                    Daily Diary Archive
                  </h2>
                </div>

                <Button
                  onClick={handleGoToday}
                  size="sm"
                  variant={isToday ? "default" : "outline"}
                  className="h-7 rounded-xl px-2.5 text-[11px] font-semibold transition-all"
                >
                  Today
                </Button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search entries…"
                  className="w-full bg-muted/50 focus:bg-background border border-border/40 focus:border-primary/50 rounded-xl pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none transition-all"
                />
              </div>
            </div>

            {/* Timeline Entry List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
              {isLoading && entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-2">
                  <Loader2 className="size-6 animate-spin text-primary/60" />
                  <span className="text-xs text-muted-foreground/60 font-medium">Loading entries…</span>
                </div>
              ) : filteredEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                  <div className="size-12 rounded-2xl bg-muted/60 flex items-center justify-center mb-3">
                    <Sparkles className="size-5 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No diary entries found</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Start writing your thoughts today!</p>
                </div>
              ) : (
                filteredEntries.map((e) => {
                  const isSelected = selectedDate === e.date;
                  const moodObj = MOOD_OPTIONS.find((m) => m.label === e.mood) || MOOD_OPTIONS[0];

                  return (
                    <div
                      key={e._id}
                      onClick={() => handleSelectDate(e.date)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-xl transition-all cursor-pointer border flex items-center justify-between gap-2",
                        isSelected
                          ? "bg-primary/10 border-primary/40 shadow-xs"
                          : "bg-card/40 hover:bg-muted/60 border-border/30 hover:border-border/60"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{moodObj.emoji}</span>
                          <h3 className={cn("text-xs font-semibold truncate", isSelected ? "text-primary" : "text-foreground")}>
                            {e.date}
                          </h3>
                        </div>
                        <p className="text-[11px] text-muted-foreground/60 truncate mt-0.5">
                          {e.wordCount > 0 ? `${e.wordCount} words` : "Empty page"}
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground/50 font-mono">
                        {format(parseISO(e.date), "MMM d")}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          {/* Right Editor Canvas */}
          <main className="flex-1 flex flex-col bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl h-full overflow-hidden min-w-0">
            {/* Header Control Bar */}
            <div className="px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-border/40 bg-card/40 shrink-0">
              
              {/* Date Header & Shift Navigation */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrevDay}
                  className="size-7 rounded-lg border border-border/40 hover:border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                  title="Previous Day"
                >
                  <ChevronLeft className="size-4" />
                </button>

                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => e.target.value && handleSelectDate(e.target.value)}
                  className="bg-muted/50 hover:bg-muted border border-border/40 rounded-xl px-2.5 py-1 text-xs font-semibold text-foreground outline-none transition-colors cursor-pointer"
                />

                <button
                  onClick={handleNextDay}
                  className="size-7 rounded-lg border border-border/40 hover:border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                  title="Next Day"
                >
                  <ChevronRight className="size-4" />
                </button>

                <Button
                  onClick={handleGoToday}
                  size="sm"
                  variant={isToday ? "default" : "outline"}
                  className="h-7 rounded-xl px-2.5 text-xs font-semibold ml-1"
                >
                  Today
                </Button>

                {/* Status Indicator */}
                <div
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ml-1",
                    isSaving
                      ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                      : hasUnsavedChanges
                      ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                      : "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                  )}
                >
                  {isSaving ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        hasUnsavedChanges ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                      )}
                    />
                  )}
                  <span className="truncate hidden sm:inline">
                    {isSaving
                      ? "Saving…"
                      : hasUnsavedChanges
                      ? "Unsaved"
                      : lastSaved
                      ? `Saved at ${format(lastSaved, "h:mm a")}`
                      : "Saved"}
                  </span>
                </div>
              </div>

              {/* Action Buttons & Tools */}
              <div className="flex items-center gap-2">
                {/* Writing Prompt Generator Button */}
                <button
                  onClick={handleInsertPrompt}
                  className="h-8 px-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-all flex items-center gap-1.5 text-xs font-semibold"
                  title="Add an inspiring journaling prompt"
                >
                  <Lightbulb className="size-3.5" />
                  <span className="hidden sm:inline">Prompt</span>
                </button>

                {/* Copy Text Button */}
                <button
                  onClick={handleCopyText}
                  className="h-8 px-2.5 rounded-xl border border-border/40 hover:border-border flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                  title="Copy entry text"
                >
                  {isCopied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                  <span className="hidden lg:inline">{isCopied ? "Copied" : "Copy"}</span>
                </button>

                {/* Focus Mode Toggle */}
                <button
                  onClick={() => setIsFocusMode(!isFocusMode)}
                  className="hidden md:flex h-8 px-2.5 rounded-xl border border-border/40 hover:border-border items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                  title={isFocusMode ? "Exit Focus Workspace" : "Fullscreen Focus Workspace"}
                >
                  {isFocusMode ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
                  <span className="hidden lg:inline">{isFocusMode ? "Exit Focus" : "Focus"}</span>
                </button>

                {activeEntry?._id && (
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="size-8 rounded-xl border border-border/40 hover:border-destructive/40 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Delete this entry"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}

                <Button
                  onClick={() => handleSave(content, mood)}
                  disabled={isSaving}
                  size="sm"
                  className="h-8 rounded-xl px-3.5 gap-1.5 text-xs font-semibold shadow-sm"
                >
                  {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                  <span>Save</span>
                </Button>
              </div>
            </div>

            {/* Date Title & Mood Banner */}
            <div className="px-6 pt-5 pb-2 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>{formatDisplayDate(selectedDate)}</span>
                {isToday && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary/15 text-primary tracking-wider uppercase">
                    Today
                  </span>
                )}
              </h1>

              {/* Mood Selector Pills */}
              <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/30">
                {MOOD_OPTIONS.map((m) => (
                  <button
                    key={m.label}
                    onClick={() => handleMoodSelect(m.label)}
                    className={cn(
                      "px-2 py-1 rounded-lg text-xs transition-all flex items-center gap-1",
                      mood === m.label
                        ? "bg-background text-foreground shadow-xs font-semibold scale-105"
                        : "text-muted-foreground hover:text-foreground opacity-70"
                    )}
                    title={`Mood: ${m.label}`}
                  >
                    <span>{m.emoji}</span>
                    <span className="text-[11px] hidden sm:inline">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-header Reading Stats */}
            <div className="px-6 pb-2 text-[11px] text-muted-foreground/60 font-mono flex items-center gap-2 shrink-0">
              <span>{wordCount} words</span>
              <span>&middot;</span>
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {readTimeMinutes} min read
              </span>
            </div>

            {/* Quill Canvas Scroll Container */}
            <div className="flex-1 overflow-y-auto px-4 md:px-10 py-4 custom-scrollbar select-text">
              <div className="max-w-4xl mx-auto space-y-4">
                <QuillEditor
                  value={content}
                  onChange={handleContentChange}
                  placeholder="What's on your mind today? Write your thoughts, ideas, or reflections here…"
                />
              </div>
            </div>
          </main>
        </div>
      </div>

      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Delete this diary page?"
        description="This action cannot be undone."
      />
    </div>
  );
}
