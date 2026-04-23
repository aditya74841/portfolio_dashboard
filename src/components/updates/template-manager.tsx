"use client";

import { useEffect, useState } from "react";
import { useUpdateStore } from "@/store/use-update-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, CheckCircle2, Circle, LayoutGrid, Edit2, Save, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

export function TemplateManager() {
  const { 
    templates, 
    fetchTemplates, 
    createTemplate, 
    updateTemplate, 
    addTemplateQuestion, 
    updateTemplateQuestion,
    deleteTemplateQuestion,
    deleteTemplate,
  } = useUpdateStore();

  const [newTemplateName, setNewTemplateName] = useState("Daily Template");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<{ id: string, name: string } | null>(null);
  
  // State for inline editing
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editTemplateName, setEditTemplateName] = useState("");
  const [editingQuestion, setEditingQuestion] = useState<{ templateId: string, index: number, text: string } | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleCreateTemplate = async () => {
    await createTemplate(newTemplateName);
    setNewTemplateName("Daily Template");
  };

  const handleDelete = async () => {
    if (templateToDelete) {
      await deleteTemplate(templateToDelete.id);
      setTemplateToDelete(null);
    }
  };

  const saveTemplateName = async (id: string) => {
    await updateTemplate(id, { name: editTemplateName });
    setEditingTemplateId(null);
  };

  const saveQuestion = async () => {
    if (editingQuestion) {
      await updateTemplateQuestion(editingQuestion.templateId, editingQuestion.index, editingQuestion.text);
      setEditingQuestion(null);
    }
  };

  return (
    <div className="grid gap-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* Create New Template Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <LayoutGrid className="size-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold">Question Templates</h2>
            <p className="text-sm text-muted-foreground">Manage recurring questions for your daily journal.</p>
          </div>
        </div>

        <div className="flex gap-3 max-w-md">
          <Input 
            placeholder="Template Name (e.g. Work Days, Weekends)" 
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            className="rounded-xl bg-card/50"
          />
          <Button onClick={handleCreateTemplate} className="rounded-xl gap-2">
            <Plus className="size-4" />
            Create
          </Button>
        </div>
      </section>

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((template) => (
          <Card key={template._id} className={`border-border/50 bg-card/30 backdrop-blur-sm transition-all ${template.isActive ? 'ring-2 ring-primary/20 border-primary/30' : ''}`}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1 flex-1">
                  {editingTemplateId === template._id ? (
                    <div className="flex items-center gap-2">
                      <Input 
                        value={editTemplateName}
                        onChange={(e) => setEditTemplateName(e.target.value)}
                        className="h-7 text-sm font-bold w-full"
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" className="size-7 text-green-500" onClick={() => saveTemplateName(template._id)}>
                        <Save className="size-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="size-7 text-muted-foreground" onClick={() => setEditingTemplateId(null)}>
                        <X className="size-4" />
                      </Button>
                    </div>
                  ) : (
                    <CardTitle 
                      className="text-base flex items-center gap-2 group/title cursor-pointer hover:text-primary transition-colors"
                      onClick={() => {
                        setEditingTemplateId(template._id);
                        setEditTemplateName(template.name);
                      }}
                    >
                      {template.name}
                      <Edit2 className="size-3 opacity-0 group-hover/title:opacity-100 transition-opacity" />
                      {template.isActive && <Badge className="text-[8px] h-4">Active</Badge>}
                    </CardTitle>
                  )}
                  <CardDescription className="text-xs">
                    {template.questions.length} recurring questions
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`size-8 ${template.isActive ? 'text-primary' : 'text-muted-foreground'}`}
                    onClick={() => updateTemplate(template._id, { isActive: !template.isActive })}
                  >
                    {template.isActive ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="size-8 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      setTemplateToDelete({ id: template._id, name: template.name });
                      setShowDeleteDialog(true);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {template.questions.map((q, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-background/40 border border-border/50 group/item">
                    {editingQuestion?.templateId === template._id && editingQuestion?.index === idx ? (
                      <div className="flex items-center gap-2 w-full">
                        <Input 
                          value={editingQuestion.text}
                          onChange={(e) => setEditingQuestion({...editingQuestion, text: e.target.value})}
                          className="h-7 text-xs w-full"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && saveQuestion()}
                        />
                        <Button size="icon" variant="ghost" className="size-7 text-green-500" onClick={saveQuestion}>
                          <Save className="size-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="size-7 text-muted-foreground" onClick={() => setEditingQuestion(null)}>
                          <X className="size-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span 
                          className="text-sm font-medium flex-1 cursor-pointer hover:text-primary transition-colors"
                          onClick={() => setEditingQuestion({ templateId: template._id, index: idx, text: q })}
                        >
                          {q}
                        </span>
                        <div className="flex items-center opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="size-6 text-muted-foreground hover:text-primary"
                            onClick={() => setEditingQuestion({ templateId: template._id, index: idx, text: q })}
                          >
                            <Edit2 className="size-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="size-6 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteTemplateQuestion(template._id, idx)}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2 border-t border-border/10">
                <Input 
                  placeholder="Add recurring question..." 
                  className="h-8 text-xs bg-background/20"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      addTemplateQuestion(template._id, e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }}
                />
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="size-8"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    if (input.value) {
                      addTemplateQuestion(template._id, input.value);
                      input.value = "";
                    }
                  }}
                >
                  <Plus className="size-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {templates.length === 0 && (
        <div className="text-center py-20 opacity-50 italic">
          No templates created yet. Create one above to manage your daily questions.
        </div>
      )}

      <ConfirmDeleteDialog 
        open={showDeleteDialog} 
        onOpenChange={setShowDeleteDialog} 
        onConfirm={handleDelete}
        title="Delete Template?"
        description="This will remove the template and its master questions. Daily entries already created won't be affected."
        itemName={templateToDelete?.name}
      />
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold uppercase tracking-widest ${className}`}>
      {children}
    </span>
  );
}
