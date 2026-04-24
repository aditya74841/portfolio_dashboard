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
  Plus,
  Monitor,
  Clock,
  MessageSquare,
  Sparkles
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { cn } from "@/lib/utils";

const moodConfig = {
  great: { icon: Heart, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", label: "Excellent" },
  good: { icon: Smile, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Good" },
  okay: { icon: Meh, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "Neutral" },
  bad: { icon: Frown, color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/20", label: "Tough" },
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
    deleteQA,
    updateScreenTime
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

  const currentMood = moodConfig[update.mood as keyof typeof moodConfig];

  return (
    <Card className="group border-border/40 bg-card/40 backdrop-blur-md hover:border-primary/30 transition-all duration-500 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/5">
      <CardHeader className="relative flex flex-row items-center justify-between py-5 px-6 border-b border-border/10 bg-gradient-to-r from-muted/20 to-transparent">
        <div className="flex items-center gap-5">
          <div className="flex flex-col items-center justify-center size-14 rounded-2xl bg-background/50 border border-border/50 shadow-inner group-hover:border-primary/30 transition-colors">
            <Calendar className="size-4 text-muted-foreground mb-1" />
            <span className="text-[11px] font-bold uppercase tracking-tighter text-foreground">
              {(() => {
                const d = new Date(update.date || update.createdAt);
                return isNaN(d.getTime()) 
                  ? "N/A" 
                  : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              })()}
            </span>
          </div>
          
          <div className="space-y-1.5">
            {isEditingTitle ? (
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="h-9 text-base font-semibold w-72 bg-background/50 border-primary/20 focus-visible:ring-primary/30"
                autoFocus
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
              />
            ) : (
              <CardTitle 
                className="text-xl font-bold tracking-tight hover:text-primary cursor-pointer transition-colors flex items-center gap-2"
                onClick={() => setIsEditingTitle(true)}
              >
                {update.title}
                <Sparkles className="size-3 text-primary/40 opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
            )}
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={cn("text-[10px] uppercase font-bold px-2 py-0 h-5 border-none", currentMood.bg, currentMood.color)}>
                {currentMood.label}
              </Badge>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MessageSquare className="size-3" />
                <span className="text-[10px] uppercase tracking-widest font-bold">
                  {update.qas.length} Reflections
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button 
            variant="ghost" 
            size="icon" 
            className="size-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5"
            onClick={() => toggleIsPublic(update._id)}
            title={update.isPublic ? "Make Private" : "Make Public"}
          >
            {update.isPublic ? <Unlock className="size-4" /> : <Lock className="size-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="size-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="size-4" />
          </Button>
          <div className="w-px h-4 bg-border/50 mx-1" />
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("size-9 rounded-xl transition-all duration-300", isExpanded ? "bg-primary/10 text-primary rotate-0" : "text-muted-foreground")}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className={cn("p-0 transition-all duration-500 ease-in-out overflow-hidden", isExpanded ? 'max-h-[2500px] opacity-100' : 'max-h-0 opacity-0')}>
        <div className="p-8 space-y-10">
          
          {/* Mood Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                <div className="size-1 bg-primary rounded-full" /> Daily Vibe
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.entries(moodConfig) as [keyof typeof moodConfig, typeof moodConfig['great']][]).map(([key, config]) => {
                  const Icon = config.icon;
                  const isActive = update.mood === key;
                  return (
                    <button
                      key={key}
                      onClick={() => updateMood(update._id, key, update.why)}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 gap-2 group/mood",
                        isActive 
                          ? cn("bg-background shadow-lg border-primary/20", config.color) 
                          : "bg-muted/10 border-transparent text-muted-foreground hover:bg-muted/20"
                      )}
                    >
                      <Icon className={cn("size-5 transition-transform duration-300", isActive ? "scale-110" : "group-hover/mood:scale-110")} />
                      <span className="text-[10px] font-bold uppercase tracking-tight">{config.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="space-y-4">
              <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                <div className="size-1 bg-primary rounded-full" /> Context
              </Label>
              <div className="relative group/why">
                <Textarea 
                  placeholder="What influenced your mood today?"
                  className="min-h-[88px] text-sm bg-muted/5 rounded-2xl border-border/50 focus-visible:ring-primary/20 pr-10 resize-none py-3"
                  defaultValue={update.why || ""}
                  onBlur={(e) => updateMood(update._id, update.mood, e.target.value)}
                />
                <div className="absolute right-3 bottom-3 opacity-0 group-focus-within/why:opacity-100 transition-opacity">
                  <div className="text-[9px] font-black uppercase tracking-tighter text-primary/40">Auto-saving</div>
                </div>
              </div>
            </div>
          </div>

          {/* Screen Time Section */}
          <div className="space-y-4">
            <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
              <div className="size-1 bg-primary rounded-full" /> Digital Well-being
            </Label>
            <div className="bg-muted/10 rounded-[2rem] border border-border/50 p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Monitor className="size-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Screen Usage</h4>
                    <p className="text-xs text-muted-foreground">Tracking your daily focus time</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 bg-background/50 p-1.5 rounded-2xl border border-border/50">
                    <div className="flex items-center gap-2 px-3">
                      <Input 
                        type="number"
                        min="0"
                        max="24"
                        className="w-12 h-8 text-center bg-transparent border-none p-0 font-bold text-lg focus-visible:ring-0"
                        defaultValue={update.screenTime?.hours || 0}
                        onBlur={(e) => updateScreenTime(update._id, Number(e.target.value), update.screenTime?.minutes || 0, update.screenTime?.note)}
                      />
                      <span className="text-[10px] font-black uppercase text-muted-foreground">h</span>
                    </div>
                    <div className="w-px h-4 bg-border/50" />
                    <div className="flex items-center gap-2 px-3">
                      <Input 
                        type="number"
                        min="0"
                        max="59"
                        className="w-12 h-8 text-center bg-transparent border-none p-0 font-bold text-lg focus-visible:ring-0"
                        defaultValue={update.screenTime?.minutes || 0}
                        onBlur={(e) => updateScreenTime(update._id, update.screenTime?.hours || 0, Number(e.target.value), update.screenTime?.note)}
                      />
                      <span className="text-[10px] font-black uppercase text-muted-foreground">m</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Reflection on usage</Label>
                <Textarea 
                  placeholder="Any insights on your digital habits today?"
                  className="min-h-[70px] text-sm bg-background/30 rounded-2xl border-border/50 focus-visible:ring-primary/20 resize-none py-3"
                  defaultValue={update.screenTime?.note || ""}
                  onBlur={(e) => updateScreenTime(update._id, update.screenTime?.hours || 0, update.screenTime?.minutes || 0, e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Q&A Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                <div className="size-1 bg-primary rounded-full" /> Deep Work & Reflection
              </Label>
              <Badge variant="outline" className="text-[10px] font-bold border-primary/20 text-primary">
                {update.qas.length} QUESTIONS
              </Badge>
            </div>
            <div className="grid gap-4">
              {update.qas.map((qa, index) => (
                <div key={index} className="group/qa relative p-6 rounded-[2rem] bg-muted/5 border border-border/50 hover:border-primary/20 hover:bg-muted/10 transition-all duration-300">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex gap-3">
                      <div className="size-8 rounded-xl bg-background border border-border/50 flex items-center justify-center text-[10px] font-black text-muted-foreground group-hover/qa:text-primary transition-colors">
                        Q{index + 1}
                      </div>
                      <p className="text-sm font-bold pt-1.5 leading-snug">{qa.question}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="size-8 rounded-xl opacity-0 group-hover/qa:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                      onClick={() => deleteQA(update._id, index)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                  <Textarea 
                    placeholder="Reflect on this..."
                    className="bg-background/50 border-none focus-visible:ring-1 focus-visible:ring-primary/20 resize-none min-h-[80px] text-sm rounded-xl py-3 px-4 shadow-inner"
                    defaultValue={qa.answer}
                    onBlur={(e) => updateAnswer(update._id, index, e.target.value)}
                  />
                </div>
              ))}
              
              <div className="relative mt-4">
                <Input 
                  placeholder="Add a custom reflection question..." 
                  className="h-12 pl-5 pr-14 text-sm bg-muted/10 rounded-2xl border-dashed border-2 border-border/50 focus:border-primary/30 transition-all focus-visible:ring-0"
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
                  size="icon" 
                  className="absolute right-2 top-2 size-8 rounded-xl shadow-lg shadow-primary/20"
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

          {/* Main Writing Section */}
          <div className="space-y-4">
            <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
              <div className="size-1 bg-primary rounded-full" /> Final Thoughts
            </Label>
            <div className="group/content relative p-1 rounded-[2rem] bg-gradient-to-br from-primary/10 via-transparent to-primary/5">
              <div className="bg-background/80 backdrop-blur-sm rounded-[1.9rem] p-1">
                <Textarea 
                  value={mainUpdate}
                  onChange={(e) => setMainUpdate(e.target.value)}
                  placeholder="Capture the essence of your day..."
                  className="min-h-[200px] border-none focus-visible:ring-0 p-6 text-base leading-relaxed resize-none rounded-[1.8rem] bg-transparent"
                />
              </div>
              <Button 
                size="sm" 
                className="absolute bottom-6 right-6 opacity-0 group-hover/content:opacity-100 transition-all gap-2 rounded-2xl px-5 h-10 shadow-xl shadow-primary/20"
                onClick={() => updateContent(update._id, mainUpdate)}
              >
                <Save className="size-4" />
                Commit to Journal
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      
      {!isExpanded && (
        <button 
          className="w-full py-4 text-center text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 hover:text-primary hover:bg-primary/5 cursor-pointer transition-all border-t border-border/5"
          onClick={() => setIsExpanded(true)}
        >
          Expand Daily Reflection
        </button>
      )}

      <ConfirmDeleteDialog 
        open={showDeleteDialog} 
        onOpenChange={setShowDeleteDialog} 
        onConfirm={handleDelete}
        title="Discard Reflection?"
        description="This journal entry and all its reflections will be permanently removed from your digital vault."
        itemName={update.title}
      />
    </Card>
  );
}
