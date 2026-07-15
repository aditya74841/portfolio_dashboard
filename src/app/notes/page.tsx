"use client";

import { useEffect, useState, useRef } from "react";
import { useNoteStore, Note } from "@/store/use-note-store";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Loader2, ChevronLeft, Check } from "lucide-react";
import { format } from "date-fns";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { cn } from "@/lib/utils";

export default function NotesPage() {
  const { notes, activeNote, isLoading, fetchNotes, createNote, updateNote, deleteNote, setActiveNote } = useNoteStore();
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Sync content with active note
  useEffect(() => {
    if (activeNote) {
      setContent(activeNote.content);
    } else {
      setContent("");
    }
    setHasUnsavedChanges(false);
  }, [activeNote]);

  // Auto-focus textarea when editor opens
  useEffect(() => {
    if (showEditor && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [showEditor, activeNote]);

  const handleContentChange = (value: string) => {
    setContent(value);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!content.trim()) return;

    setIsSaving(true);
    try {
      if (activeNote) {
        await updateNote(activeNote._id, content);
      } else {
        const newNote = await createNote(content);
        if (newNote) setActiveNote(newNote);
      }
      setHasUnsavedChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (activeNote) {
      await deleteNote(activeNote._id);
      setShowEditor(false);
    }
  };

  const handleNewNote = () => {
    setActiveNote(null);
    setContent("");
    setShowEditor(true);
    setHasUnsavedChanges(false);
  };

  const handleSelectNote = (note: Note) => {
    setActiveNote(note);
    setShowEditor(true);
  };

  const handleBack = () => {
    setShowEditor(false);
  };

  const getTitle = (text: string) => {
    if (!text) return "Untitled";
    const firstLine = text.split("\n")[0].trim();
    return firstLine.length > 50 ? firstLine.substring(0, 50) + "…" : firstLine || "Untitled";
  };

  const getPreview = (text: string) => {
    if (!text) return "";
    const lines = text.split("\n").filter((l) => l.trim());
    const secondLine = lines.length > 1 ? lines[1].trim() : "";
    return secondLine.length > 60 ? secondLine.substring(0, 60) + "…" : secondLine;
  };

  // ─── Mobile: Full-screen list / editor toggle ───
  // ─── Desktop: Side-by-side split pane ───

  return (
    <div className="flex h-[100dvh] bg-background overflow-hidden">
      <Sidebar />

      {/* ═══ MOBILE LAYOUT ═══ */}
      <div className="flex-1 flex flex-col md:hidden h-[100dvh] overflow-hidden">

        {/* Mobile: Note List View */}
        {!showEditor && (
          <div className="flex-1 flex flex-col h-full">
            {/* Top bar — leaves room for the sidebar hamburger (fixed top-4 left-4) */}
            <div className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-border/30">
              {/* Left spacer for hamburger button */}
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

            {/* Note list */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {isLoading && (notes?.length || 0) === 0 ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="size-5 animate-spin text-muted-foreground/40" />
                </div>
              ) : (notes?.length || 0) === 0 ? (
                <div className="flex flex-col items-center justify-center h-full px-8">
                  <div className="size-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                    <Plus className="size-5 text-muted-foreground/40" />
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
                          {getTitle(note.content)}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs text-muted-foreground/60 shrink-0">
                            {format(new Date(note.updatedAt), "MMM d")}
                          </span>
                          {getPreview(note.content) && (
                            <span className="text-xs text-muted-foreground/40 truncate">
                              {getPreview(note.content)}
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

        {/* Mobile: Editor View (full screen takeover) */}
        {showEditor && (
          <div className="flex-1 flex flex-col h-full">
            {/* Editor top bar — back + date only */}
            <div className="h-12 shrink-0 flex items-center justify-between px-2 border-b border-border/20">
              <button
                onClick={handleBack}
                className="h-10 px-2 rounded-lg flex items-center gap-1 text-primary active:bg-muted/50 transition-colors"
              >
                <ChevronLeft className="size-5" />
                <span className="text-sm font-medium">Notes</span>
              </button>

              <span className="text-[11px] text-muted-foreground/50 pr-2">
                {activeNote
                  ? format(new Date(activeNote.updatedAt), "MMM d, h:mm a")
                  : "New note"}
                {hasUnsavedChanges && " · Edited"}
              </span>
            </div>

            {/* Textarea */}
            <div className="flex-1 overflow-y-auto overscroll-contain pb-16">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Start writing…"
                className={cn(
                  "w-full h-full min-h-[50vh] resize-none bg-transparent text-foreground",
                  "text-base leading-relaxed px-5 py-4",
                  "placeholder:text-muted-foreground/25",
                  "outline-none border-none focus:ring-0",
                  "selection:bg-primary/10"
                )}
              />
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
                onClick={handleSave}
                disabled={isSaving || !content.trim() || !hasUnsavedChanges}
                className="h-10 rounded-xl px-5 gap-2 text-sm font-medium"
              >
                {isSaving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                Save
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ═══ DESKTOP LAYOUT ═══ */}
      <div className="hidden md:flex flex-1 h-screen overflow-hidden">

        {/* ─── Note List Pane ─── */}
        <aside className="w-80 lg:w-96 flex flex-col border-r border-border/40 bg-background shrink-0">
          {/* List Header */}
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

          {/* Note List */}
          <div className="flex-1 overflow-y-auto px-3 pb-6">
            {isLoading && (notes?.length || 0) === 0 ? (
              <div className="flex justify-center py-16">
                <Loader2 className="size-5 animate-spin text-muted-foreground/50" />
              </div>
            ) : (notes?.length || 0) === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6">
                <div className="size-10 rounded-xl bg-muted/60 flex items-center justify-center mb-3">
                  <Plus className="size-4 text-muted-foreground/60" />
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
                        isActive
                          ? "bg-muted/80"
                          : "hover:bg-muted/40"
                      )}
                    >
                      <p className={cn(
                        "text-sm font-medium truncate leading-snug",
                        isActive ? "text-foreground" : "text-foreground/80"
                      )}>
                        {getTitle(note.content)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-muted-foreground/70 shrink-0">
                          {format(new Date(note.updatedAt), "MMM d")}
                        </span>
                        {getPreview(note.content) && (
                          <span className="text-[11px] text-muted-foreground/50 truncate">
                            {getPreview(note.content)}
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

        {/* ─── Editor Pane ─── */}
        {showEditor || activeNote ? (
          <main className="flex-1 flex flex-col bg-background min-w-0">
            {/* Editor Header */}
            <div className="px-6 h-14 flex items-center justify-between shrink-0 border-b border-border/30">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-muted-foreground/70 truncate">
                  {activeNote
                    ? format(new Date(activeNote.updatedAt), "MMM d, yyyy · h:mm a")
                    : "New note"}
                </span>
                {hasUnsavedChanges && (
                  <span className="size-1.5 rounded-full bg-muted-foreground/40 shrink-0" title="Unsaved changes" />
                )}
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
                  onClick={handleSave}
                  disabled={isSaving || !content.trim() || !hasUnsavedChanges}
                  size="sm"
                  className="h-8 rounded-lg px-3 gap-1.5 text-xs font-medium"
                >
                  {isSaving ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Check className="size-3" />
                  )}
                  Save
                </Button>
              </div>
            </div>

            {/* Editor Body */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto px-10 py-12">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Start writing…"
                  className={cn(
                    "w-full min-h-[60vh] resize-none bg-transparent text-foreground",
                    "text-[15px] leading-relaxed",
                    "placeholder:text-muted-foreground/30",
                    "outline-none border-none focus:ring-0",
                    "selection:bg-primary/10"
                  )}
                />
              </div>
            </div>
          </main>
        ) : (
          /* Empty state when no note selected */
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground/40">Select a note or create a new one</p>
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
