"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useNoteStore, Note } from "@/store/use-note-store";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  Loader2,
  ChevronLeft,
  Save,
  FileText,
  Search,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Sparkles,
  Tag,
  X,
  FileCode2,
  FolderPlus,
  Layers,
  ChevronDown,
  Pencil
} from "lucide-react";
import { format } from "date-fns";
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

const DEFAULT_PRESET_CATEGORIES = ["Blog", "Ideas", "Work", "Personal", "Code", "General"];
const CUSTOM_CAT_STORAGE_KEY = "portfolio_custom_notes_categories";

/**
 * Robust HTML text extraction ignoring images, code tags, and base64 strings
 */
function stripHtml(html: string): string {
  if (!html) return "";
  if (typeof window !== "undefined" && typeof DOMParser !== "undefined") {
    try {
      const doc = new DOMParser().parseFromString(html, "text/html");
      // Remove img and style tags to prevent raw base64 snippets in preview
      doc.querySelectorAll("img, style, script, svg").forEach((el) => el.remove());
      return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
    } catch {
      // Fallback
    }
  }
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function getDisplayTitle(note: Note): string {
  if (note.title?.trim()) return note.title.trim();
  const plain = stripHtml(note.content);
  if (!plain) return "Untitled Note";
  return plain.length > 45 ? plain.substring(0, 45) + "…" : plain;
}

function getWordCount(text: string): number {
  const plain = stripHtml(text);
  if (!plain) return 0;
  return plain.split(/\s+/).filter(Boolean).length;
}

function getCharCount(text: string): number {
  return stripHtml(text).length;
}

function isContentEmpty(html: string): boolean {
  return !stripHtml(html);
}

const AUTO_SAVE_DELAY = 5000;

export default function NotesPage() {
  const {
    notes,
    activeNote,
    isLoading,
    fetchNotes,
    createNote,
    updateNote,
    bulkUpdateCategory,
    deleteNote,
    setActiveNote,
  } = useNoteStore();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Blog");
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [newCatInput, setNewCatInput] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editCatValue, setEditCatValue] = useState("");

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const newCatInputRef = useRef<HTMLInputElement>(null);
  const prevActiveIdRef = useRef<string | null>(null);
  const isSavingRef = useRef(false);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Load custom categories from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_CAT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setCustomCategories(parsed);
      }
    } catch {
      // Ignore
    }
  }, []);

  // Save custom categories to localStorage
  const saveCustomCategoriesToStorage = (cats: string[]) => {
    setCustomCategories(cats);
    try {
      localStorage.setItem(CUSTOM_CAT_STORAGE_KEY, JSON.stringify(cats));
    } catch {
      // Ignore
    }
  };

  // Sync state ONLY when switching to a DIFFERENT note ID
  useEffect(() => {
    const activeId = activeNote?._id ?? null;
    if (activeId !== prevActiveIdRef.current) {
      if (activeNote) {
        setTitle(activeNote.title || "");
        setContent(activeNote.content || "");
        setCategory(activeNote.category || "Blog");
      } else {
        setTitle("");
        setContent("");
        setCategory("Blog");
      }
      setHasUnsavedChanges(false);
      setLastSaved(null);
      prevActiveIdRef.current = activeId;
    }
  }, [activeNote?._id]);

  // Auto-focus title on new note / editor open
  useEffect(() => {
    if (showEditor && titleRef.current) {
      setTimeout(() => titleRef.current?.focus(), 150);
    }
  }, [showEditor]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, []);

  // Unique list of available categories
  const availableCategories = useMemo(() => {
    const set = new Set([...DEFAULT_PRESET_CATEGORIES, ...customCategories]);
    (notes || []).forEach((n) => {
      if (n.category) set.add(n.category.trim());
    });
    return Array.from(set);
  }, [notes, customCategories]);

  // Filter notes in sidebar based on top category selection & search query (case insensitive)
  const filteredNotes = useMemo(() => {
    let list = notes || [];
    if (selectedCategoryFilter !== "All") {
      const filterNorm = selectedCategoryFilter.trim().toLowerCase();
      list = list.filter((n) => (n.category || "Blog").trim().toLowerCase() === filterNorm);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (n) =>
          n.title?.toLowerCase().includes(q) ||
          stripHtml(n.content).toLowerCase().includes(q) ||
          n.category?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [notes, selectedCategoryFilter, searchQuery]);

  // Save handler
  const handleSave = useCallback(
    async (
      currentTitle: string,
      currentContent: string,
      currentCategory: string,
      silent = false
    ) => {
      if (!currentTitle.trim() && isContentEmpty(currentContent)) return;
      if (isSavingRef.current) return;

      isSavingRef.current = true;
      setIsSaving(true);
      try {
        if (activeNote) {
          await updateNote(activeNote._id, currentTitle, currentContent, currentCategory);
        } else {
          const newNote = await createNote(currentTitle, currentContent, currentCategory);
          if (newNote) {
            setActiveNote(newNote);
            prevActiveIdRef.current = newNote._id;
          }
        }
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
      } finally {
        isSavingRef.current = false;
        setIsSaving(false);
      }
    },
    [activeNote, updateNote, createNote, setActiveNote]
  );

  const handleSaveRef = useRef(handleSave);
  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  const scheduleAutoSave = useCallback(
    (newTitle: string, newContent: string, newCategory: string) => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        handleSaveRef.current(newTitle, newContent, newCategory, true);
      }, AUTO_SAVE_DELAY);
    },
    []
  );

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setHasUnsavedChanges(true);
    scheduleAutoSave(value, content, category);
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    setHasUnsavedChanges(true);
    scheduleAutoSave(title, value, category);
  };

  // ── Top Category Bar: ONLY filters the notes list in the sidebar ──
  const handleSelectCategoryPill = (catName: string) => {
    setSelectedCategoryFilter(catName);
  };

  // ── Dropdown Category Selector: Assigns category to active note ──
  const handleCategorySelect = (newCategory: string) => {
    setCategory(newCategory);
    setHasUnsavedChanges(true);
    scheduleAutoSave(title, content, newCategory);
  };

  const handleAddCustomCategory = () => {
    const trimmed = newCatInput.trim();
    if (!trimmed) return;
    if (!customCategories.includes(trimmed)) {
      saveCustomCategoriesToStorage([...customCategories, trimmed]);
    }
    setSelectedCategoryFilter(trimmed);
    setCategory(trimmed);
    setHasUnsavedChanges(true);
    setNewCatInput("");
    setIsAddingCategory(false);
    scheduleAutoSave(title, content, trimmed);
    toast.success(`Category "${trimmed}" added!`);
  };

  // ── Atomic Rename Category (Fixes N+1 Loop Bug) ──
  const handleRenameCategory = async (oldCat: string, newCatName: string) => {
    const trimmed = newCatName.trim();
    if (!trimmed || trimmed === oldCat) return;

    saveCustomCategoriesToStorage(customCategories.map((c) => (c === oldCat ? trimmed : c)));

    if (selectedCategoryFilter === oldCat) {
      setSelectedCategoryFilter(trimmed);
    }
    if (category === oldCat) {
      setCategory(trimmed);
      setHasUnsavedChanges(true);
      scheduleAutoSave(title, content, trimmed);
    }

    // Single atomic bulk API call
    await bulkUpdateCategory(oldCat, trimmed);
    toast.success(`Renamed category "${oldCat}" to "${trimmed}"`);
  };

  // ── Atomic Delete Category (Fixes N+1 Loop Bug) ──
  const handleDeleteCategory = async (catToDelete: string) => {
    saveCustomCategoriesToStorage(customCategories.filter((c) => c !== catToDelete));

    if (selectedCategoryFilter === catToDelete) {
      setSelectedCategoryFilter("All");
    }
    if (category === catToDelete) {
      setCategory("General");
      setHasUnsavedChanges(true);
      scheduleAutoSave(title, content, "General");
    }

    // Single atomic bulk API call
    await bulkUpdateCategory(catToDelete, "General");
    toast.success(`Category "${catToDelete}" deleted. Notes reassigned to General.`);
  };

  const handleDeleteConfirm = async () => {
    const target = noteToDelete || activeNote;
    if (target) {
      await deleteNote(target._id);
      if (activeNote?._id === target._id) {
        setShowEditor(false);
        setActiveNote(null);
      }
      setNoteToDelete(null);
      setShowDeleteDialog(false);
    }
  };

  const handleNewNote = () => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    prevActiveIdRef.current = null;
    setActiveNote(null);
    setTitle("");
    setContent("");
    setCategory(selectedCategoryFilter !== "All" ? selectedCategoryFilter : "Blog");
    setShowEditor(true);
    setHasUnsavedChanges(false);
    setLastSaved(null);
  };

  const handleSelectNote = (note: Note) => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    prevActiveIdRef.current = null;
    setActiveNote(note);
    setShowEditor(true);
  };

  const handleBack = async () => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    if (hasUnsavedChanges) await handleSave(title, content, category, true);
    setShowEditor(false);
  };

  const handleCopyText = async () => {
    const plain = stripHtml(content);
    const textToCopy = `${title ? title + "\n\n" : ""}${plain}`;
    if (!textToCopy.trim()) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      toast.success("Note content copied to clipboard!");
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error("Failed to copy text.");
    }
  };

  const currentWordCount = useMemo(() => getWordCount(content), [content]);
  const currentCharCount = useMemo(() => getCharCount(content), [content]);

  // Status label
  const statusLabel = isSaving
    ? "Saving changes…"
    : hasUnsavedChanges
    ? "Unsaved changes"
    : lastSaved
    ? `Saved at ${format(lastSaved, "h:mm a")}`
    : activeNote
    ? `Updated ${format(new Date(activeNote.updatedAt), "MMM d · h:mm a")}`
    : "Draft";

  return (
    <div className="flex h-[100dvh] bg-background overflow-hidden select-none">
      <Sidebar />

      {/* Main Full Box Workspace Container */}
      <div className="flex-1 flex flex-col p-2 md:p-4 lg:p-6 gap-3 md:gap-4 h-[100dvh] overflow-hidden bg-gradient-to-br from-background via-background to-muted/30">
        
        {/* ── TOP CATEGORY FILTER BAR (Only filters sidebar notes list) ── */}
        {!isFocusMode && (
          <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-2.5 md:px-4 md:py-3 shadow-md flex items-center justify-between gap-3 shrink-0 overflow-x-auto custom-scrollbar">
            <div className="flex items-center gap-2 shrink-0">
              <div className="size-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Tag className="size-3.5" />
              </div>
              <span className="text-xs font-bold text-foreground tracking-tight hidden sm:inline">
                Notes Categories:
              </span>
            </div>

            {/* Category Pills List */}
            <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto text-xs font-medium">
              {/* All Filter Pill */}
              <button
                onClick={() => setSelectedCategoryFilter("All")}
                className={cn(
                  "px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 border",
                  selectedCategoryFilter === "All"
                    ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                    : "bg-muted/40 hover:bg-muted/80 text-muted-foreground hover:text-foreground border-border/30"
                )}
              >
                <Layers className="size-3" />
                <span>All Notes</span>
                <span className="opacity-75 text-[10px]">({notes?.length || 0})</span>
              </button>

              {/* Category Options */}
              {availableCategories.map((cat) => {
                const count = (notes || []).filter(
                  (n) => (n.category || "Blog").trim().toLowerCase() === cat.trim().toLowerCase()
                ).length;
                const isSelected = selectedCategoryFilter.trim().toLowerCase() === cat.trim().toLowerCase();

                return (
                  <button
                    key={cat}
                    onClick={() => handleSelectCategoryPill(cat)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 border",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold scale-105"
                        : "bg-muted/40 hover:bg-muted/80 text-muted-foreground hover:text-foreground border-border/30"
                    )}
                  >
                    <span>{cat}</span>
                    <span className={cn("text-[10px]", isSelected ? "text-primary-foreground/80" : "opacity-60")}>
                      ({count})
                    </span>
                  </button>
                );
              })}

              {/* Add Custom Category Inline Tool */}
              {isAddingCategory ? (
                <div className="flex items-center gap-1 shrink-0 ml-1">
                  <input
                    ref={newCatInputRef}
                    autoFocus
                    value={newCatInput}
                    onChange={(e) => setNewCatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddCustomCategory();
                      if (e.key === "Escape") setIsAddingCategory(false);
                    }}
                    placeholder="New category..."
                    className="h-7 px-2.5 text-xs rounded-xl bg-background border border-primary/50 text-foreground placeholder:text-muted-foreground/40 outline-none w-28"
                  />
                  <Button
                    onClick={handleAddCustomCategory}
                    size="sm"
                    className="h-7 px-2.5 rounded-xl text-xs font-semibold"
                  >
                    Add
                  </Button>
                  <button
                    onClick={() => setIsAddingCategory(false)}
                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingCategory(true)}
                  className="h-7 px-2.5 rounded-xl border border-dashed border-border/70 hover:border-primary/60 text-xs font-medium text-muted-foreground hover:text-primary bg-background/40 hover:bg-primary/5 flex items-center gap-1 transition-all shrink-0 ml-1"
                >
                  <FolderPlus className="size-3.5" />
                  <span>+ Add Category</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── WORKSPACE BODY: MINIMAL SIDEBAR + MAIN EDITOR ── */}
        <div className="flex-1 flex gap-3 md:gap-5 min-h-0 overflow-hidden">
          
          {/* ── LEFT BOX: MINIMAL TILE SIDEBAR ── */}
          <aside
            className={cn(
              "flex flex-col bg-card/70 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl transition-all duration-300 shrink-0 overflow-hidden",
              isFocusMode
                ? "hidden"
                : showEditor
                ? "hidden md:flex w-72 lg:w-80 h-full"
                : "flex w-full md:w-72 lg:w-80 h-full"
            )}
          >
            {/* Sidebar Header */}
            <div className="p-3.5 border-b border-border/40 space-y-2.5 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-bold tracking-tight text-foreground flex items-center gap-1.5">
                    <span>Notes</span>
                    <span className="text-muted-foreground/40">•</span>
                    <span className="text-muted-foreground">
                      {selectedCategoryFilter === "All" ? "All" : selectedCategoryFilter}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground">
                      {filteredNotes.length}
                    </span>
                  </h2>
                </div>

                <Button
                  onClick={handleNewNote}
                  aria-label="New note"
                  size="sm"
                  className="h-7 rounded-xl px-2.5 gap-1 text-[11px] font-semibold shadow-md shadow-primary/15 transition-all hover:scale-105 active:scale-95"
                >
                  <Plus className="size-3" strokeWidth={2.5} />
                  <span>New</span>
                </Button>
              </div>

              {/* Search Input Box */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60" />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notes…"
                  className="w-full bg-muted/50 focus:bg-background border border-border/40 focus:border-primary/50 rounded-xl pl-8 pr-7 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-md"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Minimal Tile Sidebar List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
              {isLoading && (notes?.length || 0) === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-2">
                  <Loader2 className="size-6 animate-spin text-primary/60" />
                  <span className="text-xs text-muted-foreground/60 font-medium">Loading notes…</span>
                </div>
              ) : (filteredNotes?.length || 0) === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                  <div className="size-12 rounded-2xl bg-muted/60 flex items-center justify-center mb-3">
                    <Sparkles className="size-5 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {searchQuery || selectedCategoryFilter !== "All"
                      ? "No matching notes"
                      : "No notes yet"}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1 max-w-[200px]">
                    {selectedCategoryFilter !== "All"
                      ? `No notes in "${selectedCategoryFilter}" category`
                      : searchQuery
                      ? "Try searching for another keyword"
                      : "Create your first note to capture ideas"}
                  </p>
                </div>
              ) : (
                filteredNotes.map((note) => {
                  const isActive = activeNote?._id === note._id;
                  const noteCat = note.category || "Blog";

                  return (
                    <div
                      key={note._id}
                      onClick={() => handleSelectNote(note)}
                      className={cn(
                        "group relative w-full text-left px-3 py-2.5 rounded-xl transition-all cursor-pointer border select-none flex items-center justify-between gap-2.5",
                        isActive
                          ? "bg-primary/10 border-primary/40 shadow-xs"
                          : "bg-card/40 hover:bg-muted/60 border-border/30 hover:border-border/60"
                      )}
                    >
                      {/* Left title & metadata tile */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3
                            className={cn(
                              "text-xs font-semibold truncate leading-tight",
                              isActive ? "text-primary" : "text-foreground"
                            )}
                          >
                            {getDisplayTitle(note)}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-primary/15 text-primary">
                            {noteCat}
                          </span>
                          <span className="text-[10px] text-muted-foreground/50 font-mono">
                            {format(new Date(note.updatedAt), "MMM d")}
                          </span>
                        </div>
                      </div>

                      {/* Delete button on hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setNoteToDelete(note);
                          setShowDeleteDialog(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 shrink-0"
                        aria-label="Delete note"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          {/* ── RIGHT BOX: FULL WORKSPACE CANVAS ── */}
          {showEditor || activeNote ? (
            <main className="flex-1 flex flex-col bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl h-full overflow-hidden min-w-0">
              
              {/* Header Control Bar */}
              <div className="h-14 px-4 md:px-6 flex items-center justify-between shrink-0 border-b border-border/40 bg-card/40">
                
                {/* Left side status */}
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={handleBack}
                    className="md:hidden h-8 px-2 -ml-1 rounded-xl flex items-center gap-1 text-primary hover:bg-primary/10 transition-colors text-xs font-medium"
                  >
                    <ChevronLeft className="size-4" />
                    <span>Notes</span>
                  </button>

                  {/* Interactive Category Selector Dropdown for Current Note */}
                  <div className="relative">
                    <button
                      onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-semibold transition-colors cursor-pointer"
                      title="Click to assign category"
                    >
                      <Tag className="size-3 text-primary" />
                      <span>{category}</span>
                      <ChevronDown className="size-3 text-primary/70" />
                    </button>

                    {showCategoryMenu && (
                      <div className="absolute left-0 top-full mt-1.5 w-52 bg-card border border-border/60 rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                        <div className="px-2.5 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Assign Category
                        </div>
                        <div className="space-y-0.5 max-h-56 overflow-y-auto custom-scrollbar">
                          {availableCategories.map((cat) => {
                            const isEditing = editingCat === cat;

                            return (
                              <div
                                key={cat}
                                className="group/cat flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg hover:bg-muted transition-colors"
                              >
                                {isEditing ? (
                                  <div className="flex items-center gap-1 w-full">
                                    <input
                                      autoFocus
                                      value={editCatValue}
                                      onChange={(e) => setEditCatValue(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          handleRenameCategory(cat, editCatValue);
                                          setEditingCat(null);
                                        }
                                        if (e.key === "Escape") setEditingCat(null);
                                      }}
                                      className="h-6 px-2 text-xs rounded bg-background border border-primary/50 text-foreground outline-none w-full"
                                    />
                                    <button
                                      onClick={() => {
                                        handleRenameCategory(cat, editCatValue);
                                        setEditingCat(null);
                                      }}
                                      className="p-1 text-emerald-500 hover:text-emerald-600"
                                      title="Confirm rename"
                                    >
                                      <Check className="size-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => {
                                        handleCategorySelect(cat);
                                        setShowCategoryMenu(false);
                                      }}
                                      className={cn(
                                        "flex-1 text-left font-medium flex items-center gap-2 truncate",
                                        category === cat ? "text-primary font-semibold" : "text-foreground"
                                      )}
                                    >
                                      <span>{cat}</span>
                                      {category === cat && <Check className="size-3 text-primary shrink-0" />}
                                    </button>

                                    {/* Action buttons: Edit & Delete */}
                                    <div className="hidden group-hover/cat:flex items-center gap-1 shrink-0 ml-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingCat(cat);
                                          setEditCatValue(cat);
                                        }}
                                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-background/80"
                                        title="Rename category"
                                      >
                                        <Pencil className="size-3" />
                                      </button>

                                      {cat !== "General" && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteCategory(cat);
                                          }}
                                          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                          title="Delete category"
                                        >
                                          <Trash2 className="size-3" />
                                        </button>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Live Status Pill */}
                  <div
                    className={cn(
                      "flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
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
                    <span className="truncate hidden sm:inline">{statusLabel}</span>
                  </div>

                  {/* Metrics Indicator */}
                  <div className="hidden lg:flex items-center gap-2 text-[11px] text-muted-foreground/60 font-mono">
                    <span>{currentWordCount} words</span>
                    <span>&middot;</span>
                    <span>{currentCharCount} chars</span>
                  </div>
                </div>

                {/* Right Action Tools */}
                <div className="flex items-center gap-1.5">
                  {/* Copy content button */}
                  <button
                    onClick={handleCopyText}
                    className="h-8 px-2.5 rounded-xl border border-border/40 hover:border-border flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                    title="Copy content"
                  >
                    {isCopied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                    <span className="hidden lg:inline">{isCopied ? "Copied" : "Copy"}</span>
                  </button>

                  {/* Focus / Expand toggle */}
                  <button
                    onClick={() => setIsFocusMode(!isFocusMode)}
                    className="hidden md:flex h-8 px-2.5 rounded-xl border border-border/40 hover:border-border items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                    title={isFocusMode ? "Exit Fullscreen Workspace" : "Fullscreen Workspace Mode"}
                  >
                    {isFocusMode ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
                    <span className="hidden lg:inline">{isFocusMode ? "Exit Focus" : "Focus"}</span>
                  </button>

                  {/* Delete button */}
                  {activeNote && (
                    <button
                      onClick={() => {
                        setNoteToDelete(activeNote);
                        setShowDeleteDialog(true);
                      }}
                      className="size-8 rounded-xl border border-border/40 hover:border-destructive/40 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      aria-label="Delete note"
                      title="Delete note"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}

                  {/* Save button */}
                  <Button
                    onClick={() => handleSave(title, content, category)}
                    disabled={isSaving || (!title.trim() && isContentEmpty(content))}
                    size="sm"
                    className="h-8 rounded-xl px-3.5 gap-1.5 text-xs font-semibold shadow-sm"
                  >
                    {isSaving ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Save className="size-3.5" />
                    )}
                    <span>Save</span>
                  </Button>
                </div>
              </div>

              {/* Main Canvas Scroll Area */}
              <div className="flex-1 overflow-y-auto px-4 md:px-12 py-6 md:py-8 custom-scrollbar select-text">
                <div className="max-w-4xl mx-auto space-y-4">
                  
                  {/* Title Input Field */}
                  <input
                    ref={titleRef}
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Post title…"
                    className="w-full bg-transparent outline-none border-none text-2xl md:text-3xl font-extrabold text-foreground tracking-tight placeholder:text-muted-foreground/30 leading-snug"
                  />

                  {/* Keyboard Shortcut Hints Bar */}
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground/40 font-mono py-1 border-y border-border/20 select-none overflow-x-auto">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-foreground/70 font-sans">Ctrl+B</kbd> Bold
                    </span>
                    <span>&middot;</span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-foreground/70 font-sans">Ctrl+I</kbd> Italic
                    </span>
                    <span>&middot;</span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-foreground/70 font-sans">Ctrl+U</kbd> Underline
                    </span>
                    <span>&middot;</span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-foreground/70 font-sans">Ctrl+]</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-foreground/70 font-sans">Ctrl+[</kbd> Size
                    </span>
                  </div>

                  {/* Rich Editor Canvas */}
                  <QuillEditor
                    value={content}
                    onChange={handleContentChange}
                    placeholder="Write your note content here…"
                  />
                </div>
              </div>
            </main>
          ) : (
            /* Empty Workspace State */
            <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl p-8 text-center">
              <div className="size-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-inner">
                <FileCode2 className="size-8" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Full Box Workspace</h2>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                Select a note from the sidebar or click <strong className="text-foreground">+ New</strong> to start writing in your distraction-free editor.
              </p>
              <Button
                onClick={handleNewNote}
                size="sm"
                className="mt-5 rounded-xl px-4 text-xs gap-1.5 font-semibold"
              >
                <Plus className="size-3.5" />
                <span>Create New Note</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Delete this note?"
        description="This action cannot be undone."
      />
    </div>
  );
}
