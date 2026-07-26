"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useNoteStore, Note } from "@/store/use-note-store";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Loader2, ChevronLeft, Save, FileText } from "lucide-react";
import { format } from "date-fns";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { cn } from "@/lib/utils";

// Dynamically import Quill to avoid SSR issues (Quill needs window)
const QuillEditor = dynamic(
  () => import("@/components/notes/QuillEditor").then((m) => m.QuillEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground/40" />
      </div>
    ),
  }
);

// Strips HTML tags to produce plain text for previews
function stripHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function getDisplayTitle(note: Note): string {
  if (note.title?.trim()) return note.title.trim();
  const plain = stripHtml(note.content);
  if (!plain) return "Untitled";
  return plain.length > 50 ? plain.substring(0, 50) + "…" : plain;
}

function getPreview(note: Note): string {
  const plain = stripHtml(note.content);
  if (!plain) return "";
  return plain.length > 70 ? plain.substring(0, 70) + "…" : plain;
}

// Check if content is empty (Quill empty = "<p><br></p>")
function isContentEmpty(html: string): boolean {
  const stripped = stripHtml(html);
  return !stripped;
}

const AUTO_SAVE_DELAY = 5000; // 5 seconds

export default function NotesPage() {
  const {
    notes,
    activeNote,
    isLoading,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    setActiveNote,
  } = useNoteStore();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Sync state when active note changes
  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title || "");
      setContent(activeNote.content || "");
    } else {
      setTitle("");
      setContent("");
    }
    setHasUnsavedChanges(false);
    setLastSaved(null);
  }, [activeNote]);

  // Auto-focus title on open
  useEffect(() => {
    if (showEditor && titleRef.current) {
      setTimeout(() => titleRef.current?.focus(), 150);
    }
  }, [showEditor, activeNote]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, []);

  // ── Save function ──
  const handleSave = useCallback(
    async (currentTitle: string, currentContent: string, silent = false) => {
      if (!currentTitle.trim() && isContentEmpty(currentContent)) return;

      setIsSaving(true);
      try {
        if (activeNote) {
          await updateNote(activeNote._id, currentTitle, currentContent);
        } else {
          const newNote = await createNote(currentTitle, currentContent);
          if (newNote) setActiveNote(newNote);
        }
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
      } finally {
        setIsSaving(false);
      }
    },
    [activeNote, updateNote, createNote, setActiveNote]
  );

  // ── Schedule auto-save ──
  const scheduleAutoSave = useCallback(
    (newTitle: string, newContent: string) => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        handleSave(newTitle, newContent, true);
      }, AUTO_SAVE_DELAY);
    },
    [handleSave]
  );

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setHasUnsavedChanges(true);
    scheduleAutoSave(value, content);
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    setHasUnsavedChanges(true);
    scheduleAutoSave(title, value);
  };

  const handleDelete = async () => {
    if (activeNote) {
      await deleteNote(activeNote._id);
      setShowEditor(false);
    }
  };

  const handleNewNote = () => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setActiveNote(null);
    setTitle("");
    setContent("");
    setShowEditor(true);
    setHasUnsavedChanges(false);
    setLastSaved(null);
  };

  const handleSelectNote = (note: Note) => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setActiveNote(note);
    setShowEditor(true);
  };

  const handleBack = () => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    // Save any pending changes before going back
    if (hasUnsavedChanges) handleSave(title, content, true);
    setShowEditor(false);
  };

  // ── Status label ──
  const statusLabel = isSaving
    ? "Saving…"
    : hasUnsavedChanges
    ? "Unsaved"
    : lastSaved
    ? `Saved ${format(lastSaved, "h:mm a")}`
    : activeNote
    ? format(new Date(activeNote.updatedAt), "MMM d, yyyy · h:mm a")
    : "New note";

  // ─────────────────────────────────────────────────────────────────────────
  // ── SHARED EDITOR CONTENT (used by both mobile + desktop) ──
  // ─────────────────────────────────────────────────────────────────────────
  const EditorContent = (
    <div className="max-w-4xl mx-auto px-6 md:px-16 py-10">
      {/* Blog title input */}
      <input
        ref={titleRef}
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        placeholder="Post title…"
        className={cn(
          "w-full bg-transparent outline-none border-none",
          "text-[1.75rem] md:text-[2.25rem] font-bold text-foreground tracking-tight",
          "placeholder:text-muted-foreground/20",
          "mb-2 leading-tight"
        )}
      />

      {/* Shortcut hints */}
      <p className="text-[11px] text-muted-foreground/35 mb-6 select-none">
        <span className="font-mono">Ctrl+B</span> Bold &middot;{" "}
        <span className="font-mono">Ctrl+I</span> Italic &middot;{" "}
        <span className="font-mono">Ctrl+U</span> Underline
      </p>

      {/* Quill rich text editor */}
      <QuillEditor
        value={content}
        onChange={handleContentChange}
        placeholder="Write something…"
      />
    </div>
  );

  return (
    <div className="flex h-[100dvh] bg-background overflow-hidden">
      <Sidebar />

      {/* ═══ MOBILE LAYOUT ═══ */}
      <div className="flex-1 flex flex-col md:hidden h-[100dvh] overflow-hidden">

        {/* Mobile: Note List */}
        {!showEditor && (
          <div className="flex-1 flex flex-col h-full">
            <div className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-border/30">
              <div className="w-10" />
              <span className="text-sm font-medium text-foreground">Notes</span>
              <button
                onClick={handleNewNote}
                className="size-10 rounded-xl flex items-center justify-center text-muted-foreground active:bg-muted/60 transition-colors"
                aria-label="New note"
              >
                <Plus className="size-5" strokeWidth={1.8} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain">
              {isLoading && (notes?.length || 0) === 0 ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="size-5 animate-spin text-muted-foreground/40" />
                </div>
              ) : (notes?.length || 0) === 0 ? (
                <div className="flex flex-col items-center justify-center h-full px-8">
                  <div className="size-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                    <FileText className="size-5 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">No notes yet</p>
                  <p className="text-xs text-muted-foreground/50 mt-1 text-center">
                    Tap + to start writing
                  </p>
                </div>
              ) : (
                <div className="py-1">
                  {(notes || []).map((note) => {
                    const isActive = activeNote?._id === note._id;
                    return (
                      <button
                        key={note._id}
                        onClick={() => handleSelectNote(note)}
                        className={cn(
                          "w-full text-left px-5 py-4 border-b border-border/20 active:bg-muted/50 transition-colors",
                          isActive && "bg-muted/30"
                        )}
                      >
                        <p className="text-[15px] font-medium truncate leading-snug text-foreground">
                          {getDisplayTitle(note)}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs text-muted-foreground/60 shrink-0">
                            {format(new Date(note.updatedAt), "MMM d")}
                          </span>
                          {getPreview(note) && (
                            <span className="text-xs text-muted-foreground/40 truncate">
                              {getPreview(note)}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile: Editor */}
        {showEditor && (
          <div className="flex-1 flex flex-col h-full">
            {/* Top bar */}
            <div className="h-12 shrink-0 flex items-center justify-between px-2 border-b border-border/20">
              <button
                onClick={handleBack}
                className="h-10 px-2 rounded-lg flex items-center gap-1 text-primary active:bg-muted/50 transition-colors"
              >
                <ChevronLeft className="size-5" />
                <span className="text-sm font-medium">Notes</span>
              </button>

              <span className="text-[11px] text-muted-foreground/50 pr-2">
                {statusLabel}
              </span>
            </div>

            {/* Quill editor */}
            <div className="flex-1 overflow-y-auto overscroll-contain pb-16">
              {EditorContent}
            </div>

            {/* Bottom action bar */}
            <div className="shrink-0 border-t border-border/30 bg-background/95 backdrop-blur-md px-4 py-3 flex items-center justify-between safe-area-bottom">
              {activeNote ? (
                <button
                  onClick={() => setShowDeleteDialog(true)}
                  className="h-10 px-4 rounded-xl flex items-center gap-2 text-muted-foreground active:text-destructive active:bg-destructive/10 transition-colors"
                  aria-label="Delete note"
                >
                  <Trash2 className="size-4" />
                  <span className="text-sm">Delete</span>
                </button>
              ) : (
                <div />
              )}
              <Button
                onClick={() => handleSave(title, content)}
                disabled={isSaving || (!title.trim() && isContentEmpty(content))}
                className="h-10 rounded-xl px-5 gap-2 text-sm font-medium"
              >
                {isSaving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Save Now
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ═══ DESKTOP LAYOUT ═══ */}
      <div className="hidden md:flex flex-1 h-screen overflow-hidden">

        {/* ── Note List Pane ── */}
        <aside className="w-72 lg:w-80 flex flex-col border-r border-border/40 bg-background shrink-0">
          <div className="px-5 py-5 flex items-center justify-between shrink-0">
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              Notes
              {(notes?.length || 0) > 0 && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">{notes.length}</span>
              )}
            </h1>
            <button
              onClick={handleNewNote}
              className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              aria-label="New note"
            >
              <Plus className="size-4" strokeWidth={2} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-6">
            {isLoading && (notes?.length || 0) === 0 ? (
              <div className="flex justify-center py-16">
                <Loader2 className="size-5 animate-spin text-muted-foreground/50" />
              </div>
            ) : (notes?.length || 0) === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6">
                <div className="size-10 rounded-xl bg-muted/60 flex items-center justify-center mb-3">
                  <FileText className="size-4 text-muted-foreground/60" />
                </div>
                <p className="text-sm text-muted-foreground text-center">No notes yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1 text-center">
                  Click + to start writing
                </p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {(notes || []).map((note) => {
                  const isActive = activeNote?._id === note._id;
                  return (
                    <button
                      key={note._id}
                      onClick={() => handleSelectNote(note)}
                      className={cn(
                        "w-full text-left px-3 py-3 rounded-lg transition-colors group",
                        isActive ? "bg-muted/80" : "hover:bg-muted/40"
                      )}
                    >
                      <p
                        className={cn(
                          "text-sm font-medium truncate leading-snug",
                          isActive ? "text-foreground" : "text-foreground/80"
                        )}
                      >
                        {getDisplayTitle(note)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-muted-foreground/70 shrink-0">
                          {format(new Date(note.updatedAt), "MMM d")}
                        </span>
                        {getPreview(note) && (
                          <span className="text-[11px] text-muted-foreground/50 truncate">
                            {getPreview(note)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* ── Editor Pane ── */}
        {showEditor || activeNote ? (
          <main className="flex-1 flex flex-col bg-background min-w-0">
            {/* Editor header */}
            <div className="px-6 h-14 flex items-center justify-between shrink-0 border-b border-border/30">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={cn(
                    "text-xs truncate transition-colors",
                    isSaving
                      ? "text-muted-foreground/70"
                      : hasUnsavedChanges
                      ? "text-amber-500/80"
                      : "text-muted-foreground/50"
                  )}
                >
                  {statusLabel}
                </span>
                {isSaving && <Loader2 className="size-3 animate-spin text-muted-foreground/50 shrink-0" />}
              </div>

              <div className="flex items-center gap-1">
                {activeNote && (
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="size-8 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                    aria-label="Delete note"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
                <Button
                  onClick={() => handleSave(title, content)}
                  disabled={isSaving || (!title.trim() && isContentEmpty(content))}
                  size="sm"
                  className="h-8 rounded-lg px-3 gap-1.5 text-xs font-medium"
                >
                  {isSaving ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Save className="size-3" />
                  )}
                  Save Now
                </Button>
              </div>
            </div>

            {/* Editor body */}
            <div className="flex-1 overflow-y-auto">
              {EditorContent}
            </div>
          </main>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="size-12 rounded-2xl bg-muted/50 flex items-center justify-center">
              <FileText className="size-5 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground/50">Select a note or create a new one</p>
          </div>
        )}
      </div>

      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Delete this note?"
        description="This action cannot be undone."
      />
    </div>
  );
}
