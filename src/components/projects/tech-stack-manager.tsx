"use client";

import { useState } from "react";
import { Project, useProjectStore } from "@/store/use-project-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Layers,
  Plus,
  Trash2,
  Cpu,
  X,
  Sparkles,
} from "lucide-react";

interface TechStackManagerProps {
  project: Project;
}

export function TechStackManager({ project }: TechStackManagerProps) {
  const { addTechCategory, removeTechCategory, addTechItem, removeTechItem } =
    useProjectStore();

  const [newCatName, setNewCatName] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);

  const [activeCatForAddItem, setActiveCatForAddItem] = useState<string | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemDesc, setItemDesc] = useState("");

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      await addTechCategory(project._id, newCatName.trim());
      setNewCatName("");
      setShowAddCat(false);
      toast.success(`Added tech category "${newCatName.trim()}"`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add category";
      toast.error(msg);
    }
  };

  const handleRemoveCategory = async (categoryName: string) => {
    if (confirm(`Remove category "${categoryName}" and all its items?`)) {
      try {
        await removeTechCategory(project._id, categoryName);
        toast.success(`Removed category "${categoryName}"`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to remove category";
        toast.error(msg);
      }
    }
  };

  const handleAddItem = async (categoryName: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    try {
      await addTechItem(project._id, categoryName, {
        name: itemName.trim(),
        description: itemDesc.trim(),
      });
      setItemName("");
      setItemDesc("");
      setActiveCatForAddItem(null);
      toast.success(`Added tech "${itemName.trim()}"`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add tech item";
      toast.error(msg);
    }
  };

  const handleRemoveItem = async (categoryName: string, itemName: string) => {
    try {
      await removeTechItem(project._id, categoryName, itemName);
      toast.success(`Removed "${itemName}"`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove item";
      toast.error(msg);
    }
  };

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Layers className="size-4" />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground">Technology Architecture</h3>
            <p className="text-xs text-muted-foreground">
              Categorized stack overview with dynamic items & descriptions
            </p>
          </div>
        </div>

        {!showAddCat && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddCat(true)}
            className="gap-1.5 rounded-xl text-xs font-semibold"
          >
            <Plus className="size-3.5" /> Category
          </Button>
        )}
      </div>

      {/* Form to Add New Category */}
      {showAddCat && (
        <form onSubmit={handleAddCategory} className="flex items-center gap-2 p-3 bg-muted/40 border border-border/50 rounded-xl">
          <Input
            placeholder="e.g. Frontend, AI / ML, Database, Infrastructure"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="h-9 text-xs"
            autoFocus
          />
          <Button type="submit" size="sm" className="h-9 px-3 text-xs">
            Add
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAddCat(false)}
            className="h-9 px-2 text-muted-foreground"
          >
            <X className="size-4" />
          </Button>
        </form>
      )}

      {/* Tech Stack Categories List */}
      {project.techStack.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-border/50 rounded-xl">
          <Cpu className="size-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">No technology categories added yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {project.techStack.map((catGroup) => (
            <div
              key={catGroup.category}
              className="p-4 bg-muted/30 border border-border/40 rounded-xl space-y-2.5"
            >
              {/* Category Header */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  {catGroup.category}
                </span>

                <div className="flex items-center gap-1">
                  {activeCatForAddItem !== catGroup.category && (
                    <button
                      onClick={() => {
                        setActiveCatForAddItem(catGroup.category);
                        setItemName("");
                        setItemDesc("");
                      }}
                      className="text-[11px] font-medium text-muted-foreground hover:text-primary flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Plus className="size-3" /> Tech Item
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveCategory(catGroup.category)}
                    className="text-muted-foreground hover:text-destructive p-1 rounded-lg hover:bg-muted transition-colors"
                    title="Remove Category"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Form to add item into this category */}
              {activeCatForAddItem === catGroup.category && (
                <form
                  onSubmit={(e) => handleAddItem(catGroup.category, e)}
                  className="space-y-2 p-3 bg-card border border-border/50 rounded-xl"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Input
                      placeholder="Tech name (e.g. Next.js 15)"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      className="h-8 text-xs"
                      autoFocus
                      required
                    />
                    <Input
                      placeholder="Role / Description (e.g. App Router & SSR)"
                      value={itemDesc}
                      onChange={(e) => setItemDesc(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveCatForAddItem(null)}
                      className="h-7 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" className="h-7 text-xs px-3">
                      Add Tech
                    </Button>
                  </div>
                </form>
              )}

              {/* Tech Items List */}
              {catGroup.items.length === 0 ? (
                <p className="text-[11px] text-muted-foreground/60 italic">No tech items in this category.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {catGroup.items.map((item) => (
                    <div
                      key={item.name}
                      className="group/item inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border/50 text-xs shadow-2xs hover:border-primary/40 transition-colors"
                    >
                      <div>
                        <span className="font-semibold text-foreground">{item.name}</span>
                        {item.description && (
                          <span className="text-[11px] text-muted-foreground ml-1.5 font-normal">
                            — {item.description}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveItem(catGroup.category, item.name)}
                        className="opacity-0 group-hover/item:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                        title="Remove tech item"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
