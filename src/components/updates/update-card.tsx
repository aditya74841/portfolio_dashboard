"use client";

import { useState } from "react";
import { JournalUpdate, useUpdateStore } from "@/store/use-update-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Trash2, 
  Lock, 
  Unlock, 
  ChevronDown, 
  ChevronUp,
  Smile,
  Meh,
  Frown,
  Heart,
  Save,
  Plus
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

const moodConfig = {
  great: { icon: <Heart className="size-4" />, color: "text-red-500", label: "Great" },
  good: { icon: <Smile className="size-4" />, color: "text-green-500", label: "Good" },
  okay: { icon: <Meh className="size-4" />, color: "text-yellow-500", label: "Okay" },
  bad: { icon: <Frown className="size-4" />, color: "text-blue-500", label: "Bad" },
};

export function UpdateCard({ update }: { update: JournalUpdate }) {
  const { 
    updateTitle, 
    updateMood, 
    updateContent, 
    toggleIsPublic, 
    deleteUpdate,
    updateAnswer,
    addQA,
    deleteQA
  } = useUpdateStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [title, setTitle] = useState(update.title);
  const [mainUpdate, setMainUpdate] = useState(update.update || "");
  const [newQuestion, setNewQuestion] = useState("");

  const handleTitleSubmit = () => {
    updateTitle(update._id, title);
    setIsEditingTitle(false);
  };

  const handleDelete = async () => {
    await deleteUpdate(update._id);
  };

  return (
    <Card className="group border-border/50 bg-card/30 backdrop-blur-sm hover:border-primary/20 transition-all overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-border/10 bg-muted/10">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-primary/5 border border-primary/10">
            <Calendar className="size-4 text-primary mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-tight text-primary text-center">
              {(() => {
                const d = new Date(update.date || update.createdAt);
                return isNaN(d.getTime()) 
                  ? "N/A" 
                  : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              })()}
            </span>
          </div>
          
          <div className="space-y-1">
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <Input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  className="h-8 text-sm w-64"
                  autoFocus
                  onBlur={handleTitleSubmit}
                  onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                />
              </div>
            ) : (
              <CardTitle 
                className="text-lg font-bold hover:text-primary cursor-pointer transition-colors"
                onClick={() => setIsEditingTitle(true)}
              >
                {update.title}
              </CardTitle>
            )}
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px] uppercase h-5 bg-background/50">
                {update.mood}
              </Badge>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                {update.qas.length} Questions
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="ghost" 
            size="icon" 
            className="size-8 text-muted-foreground hover:text-primary"
            onClick={() => toggleIsPublic(update._id)}
          >
            {update.isPublic ? <Unlock className="size-4" /> : <Lock className="size-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="size-8 text-muted-foreground hover:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="size-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="size-8"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className={`p-0 transition-all ${isExpanded ? 'max-h-[2000px]' : 'max-h-0'} overflow-hidden`}>
        <div className="p-6 space-y-8 animate-in slide-in-from-top-2 duration-300">
          
          {/* Mood Selector */}
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Daily Vibe</Label>
            <div className="flex gap-2">
              {(Object.entries(moodConfig) as [keyof typeof moodConfig, typeof moodConfig['great']][]).map(([key, config]) => (
                <Button
                  key={key}
                  variant={update.mood === key ? "default" : "outline"}
                  size="sm"
                  className={`gap-2 h-9 rounded-xl ${update.mood === key ? 'shadow-lg shadow-primary/20' : ''}`}
                  onClick={() => updateMood(update._id, key)}
                >
                  <div className={update.mood === key ? 'text-primary-foreground' : config.color}>
                    {config.icon}
                  </div>
                  <span className="text-xs">{config.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Q&A Section */}
          <div className="space-y-4">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Deep Work & Reflection</Label>
            <div className="grid gap-4">
              {update.qas.map((qa, index) => (
                <div key={index} className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-3 group/qa">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-primary">{qa.question}</p>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="size-6 opacity-0 group-hover/qa:opacity-100 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteQA(update._id, index)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                  <Textarea 
                    placeholder="Type your answer here..."
                    className="bg-background/50 border-none focus-visible:ring-1 focus-visible:ring-primary/20 resize-none min-h-[60px] text-sm"
                    defaultValue={qa.answer}
                    onBlur={(e) => updateAnswer(update._id, index, e.target.value)}
                  />
                </div>
              ))}
              
              <div className="flex gap-2 mt-2">
                <Input 
                  placeholder="Ask another question..." 
                  className="h-9 text-sm bg-background/30 rounded-xl"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newQuestion) {
                      addQA(update._id, newQuestion);
                      setNewQuestion("");
                    }
                  }}
                />
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="rounded-xl h-9"
                  onClick={() => {
                    if (newQuestion) {
                      addQA(update._id, newQuestion);
                      setNewQuestion("");
                    }
                  }}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Main Update Text */}
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Free Writing / Summary</Label>
            <div className="relative group/content">
              <Textarea 
                value={mainUpdate}
                onChange={(e) => setMainUpdate(e.target.value)}
                placeholder="Write your main thoughts for the day..."
                className="min-h-[150px] bg-background/40 border-border/50 rounded-2xl focus-visible:ring-primary/30 p-4"
              />
              <Button 
                size="sm" 
                className="absolute bottom-4 right-4 opacity-0 group-hover/content:opacity-100 transition-opacity gap-2 rounded-xl"
                onClick={() => updateContent(update._id, mainUpdate)}
              >
                <Save className="size-3" />
                Save Entry
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      
      {!isExpanded && (
        <div 
          className="p-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 hover:text-primary cursor-pointer transition-colors"
          onClick={() => setIsExpanded(true)}
        >
          Click to expand reflection
        </div>
      )}

      <ConfirmDeleteDialog 
        open={showDeleteDialog} 
        onOpenChange={setShowDeleteDialog} 
        onConfirm={handleDelete}
        title="Discard Reflection?"
        description="This journal entry and all its answers will be permanently removed."
        itemName={update.title}
      />
    </Card>
  );
}
