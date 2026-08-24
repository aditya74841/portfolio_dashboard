"use client";

import { useEffect, useState } from "react";
import { useBlogStore, Blog, RepurposedContent } from "@/store/use-blog-store";
import { Sidebar } from "@/components/layout/sidebar";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import {
  BookOpen,
  Plus,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Share2,
  Layers,
  Sparkles,
  Twitter,
  Linkedin,
  Mail,
  Trash2,
  Edit3,
  Globe,
  Tag,
  AlertCircle,
  FileText,
  Filter,
  CheckSquare,
  Square,
  ListCheck,
} from "lucide-react";
import { format } from "date-fns";

export default function BlogsPage() {
  const {
    blogs,
    todayTasks,
    isLoading,
    fetchBlogs,
    fetchTodayTasks,
    addBlog,
    updateBlog,
    deleteBlog,
    togglePlatform,
    addCustomPlatform,
    deleteCustomPlatform,
    addRepurposedContent,
    updateRepurposedContent,
    deleteRepurposedContent,
  } = useBlogStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<
    "today" | "ideas" | "repository" | "checklist" | "repurpose"
  >("today");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Create Blog Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStatus, setNewStatus] = useState<
    "idea" | "drafting" | "written" | "published"
  >("idea");
  const [newDueDate, setNewDueDate] = useState("");
  const [newTags, setNewTags] = useState("");
  const [newAudience, setNewAudience] = useState("");

  // Edit Blog Modal state
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editStatus, setEditStatus] = useState<
    "idea" | "drafting" | "written" | "published" | "archived"
  >("idea");
  const [editDueDate, setEditDueDate] = useState("");
  const [editTags, setEditTags] = useState("");

  // Delete Blog Modal state
  const [deleteBlogId, setDeleteBlogId] = useState<string | null>(null);

  // Add Custom Platform Modal state
  const [customPlatformBlogId, setCustomPlatformBlogId] = useState<string | null>(
    null
  );
  const [customPlatformName, setCustomPlatformName] = useState("");

  // Add Repurposed Content Modal state
  const [repurposeBlogId, setRepurposeBlogId] = useState<string | null>(null);
  const [repurposeTitle, setRepurposeTitle] = useState("");
  const [repurposePlatform, setRepurposePlatform] = useState<
    "X (Twitter)" | "LinkedIn" | "Newsletter" | "YouTube" | "Other"
  >("X (Twitter)");
  const [repurposeType, setRepurposeType] = useState<
    "post" | "thread" | "article" | "carousel" | "script"
  >("post");
  const [repurposeCopy, setRepurposeCopy] = useState("");
  const [repurposeDueDate, setRepurposeDueDate] = useState("");

  useEffect(() => {
    fetchBlogs(statusFilter, searchQuery);
    fetchTodayTasks();
  }, [fetchBlogs, fetchTodayTasks, statusFilter, searchQuery]);

  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await addBlog({
      title: newTitle.trim(),
      description: newDescription.trim(),
      status: newStatus,
      dueDate: newDueDate || undefined,
      tags: newTags
        ? newTags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
      targetAudience: newAudience.trim(),
    });

    setNewTitle("");
    setNewDescription("");
    setNewStatus("idea");
    setNewDueDate("");
    setNewTags("");
    setNewAudience("");
    setIsCreateOpen(false);
  };

  const handleOpenEdit = (blog: Blog) => {
    setEditingBlog(blog);
    setEditTitle(blog.title);
    setEditDescription(blog.description || "");
    setEditContent(blog.content || "");
    setEditStatus(blog.status);
    setEditDueDate(
      blog.dueDate ? new Date(blog.dueDate).toISOString().split("T")[0] : ""
    );
    setEditTags(blog.tags ? blog.tags.join(", ") : "");
  };

  const handleSaveEdit = async () => {
    if (!editingBlog || !editTitle.trim()) return;

    await updateBlog(editingBlog._id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      content: editContent,
      status: editStatus,
      dueDate: editDueDate || undefined,
      tags: editTags
        ? editTags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
    });

    setEditingBlog(null);
  };

  const handleAddPlatform = async () => {
    if (!customPlatformBlogId || !customPlatformName.trim()) return;
    await addCustomPlatform(customPlatformBlogId, customPlatformName.trim());
    setCustomPlatformName("");
    setCustomPlatformBlogId(null);
  };

  const handleAddRepurposed = async () => {
    if (!repurposeBlogId || !repurposeTitle.trim()) return;
    await addRepurposedContent(repurposeBlogId, {
      title: repurposeTitle.trim(),
      platform: repurposePlatform,
      contentType: repurposeType,
      copyContent: repurposeCopy.trim(),
      status: "todo",
      dueDate: repurposeDueDate || undefined,
    });
    setRepurposeTitle("");
    setRepurposeCopy("");
    setRepurposeDueDate("");
    setRepurposeBlogId(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "idea":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
            💡 Idea
          </Badge>
        );
      case "drafting":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            ✍️ Drafting
          </Badge>
        );
      case "written":
        return (
          <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
            📝 Written
          </Badge>
        );
      case "published":
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            🚀 Published
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "x (twitter)":
      case "x":
      case "twitter":
        return <Twitter className="size-4 text-sky-400" />;
      case "linkedin":
        return <Linkedin className="size-4 text-blue-600" />;
      case "newsletter":
      case "substack":
        return <Mail className="size-4 text-orange-500" />;
      default:
        return <Globe className="size-4 text-primary" />;
    }
  };

  const ideasCount = blogs.filter((b) => b.status === "idea").length;
  const writtenCount = blogs.filter(
    (b) => b.status === "drafting" || b.status === "written"
  ).length;
  const publishedCount = blogs.filter((b) => b.status === "published").length;
  const todayTasksCount = todayTasks?.totalTasksCount || 0;

  return (
    <div className="flex h-screen bg-background overflow-hidden animate-in fade-in duration-700">
      <Sidebar />
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <PageWrapper className="py-8 md:py-12">
          <div className="space-y-8 pb-16">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <BookOpen className="size-8 text-primary" /> Blog Command Center
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your blog backlog, multi-platform publishing checklists, social micro-content, and daily tasks.
            </p>
          </div>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="rounded-xl shadow-lg shadow-primary/20 gap-2 shrink-0"
          >
            <Plus className="size-5" /> New Blog / Idea
          </Button>
        </div>

        {/* Analytics & Summary Widgets */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            className={`cursor-pointer transition-all hover:border-primary/50 ${
              activeTab === "today" ? "border-primary bg-primary/5" : ""
            }`}
            onClick={() => setActiveTab("today")}
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">
                  Today's Action Items
                </p>
                <h3 className="text-2xl font-bold mt-1 text-primary">
                  {todayTasksCount}
                </h3>
              </div>
              <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <CheckSquare className="size-6" />
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:border-amber-500/50 ${
              activeTab === "ideas" ? "border-amber-500 bg-amber-500/5" : ""
            }`}
            onClick={() => setActiveTab("ideas")}
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">
                  Blog Ideas
                </p>
                <h3 className="text-2xl font-bold mt-1 text-amber-500">
                  {ideasCount}
                </h3>
              </div>
              <div className="size-11 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Sparkles className="size-6" />
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:border-blue-500/50 ${
              activeTab === "repository" ? "border-blue-500 bg-blue-500/5" : ""
            }`}
            onClick={() => setActiveTab("repository")}
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">
                  Drafts & Written
                </p>
                <h3 className="text-2xl font-bold mt-1 text-blue-500">
                  {writtenCount}
                </h3>
              </div>
              <div className="size-11 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <FileText className="size-6" />
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:border-emerald-500/50 ${
              activeTab === "checklist" ? "border-emerald-500 bg-emerald-500/5" : ""
            }`}
            onClick={() => setActiveTab("checklist")}
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">
                  Published Blogs
                </p>
                <h3 className="text-2xl font-bold mt-1 text-emerald-500">
                  {publishedCount}
                </h3>
              </div>
              <div className="size-11 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Globe className="size-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-border/50 pb-2 overflow-x-auto gap-2">
          <div className="flex items-center gap-2 min-w-max">
            <Button
              variant={activeTab === "today" ? "default" : "ghost"}
              onClick={() => setActiveTab("today")}
              className="rounded-xl gap-2 text-sm"
            >
              <CheckSquare className="size-4" /> Today's Action Items ({todayTasksCount})
            </Button>
            <Button
              variant={activeTab === "ideas" ? "default" : "ghost"}
              onClick={() => setActiveTab("ideas")}
              className="rounded-xl gap-2 text-sm"
            >
              <Sparkles className="size-4" /> Ideas Backlog ({ideasCount})
            </Button>
            <Button
              variant={activeTab === "repository" ? "default" : "ghost"}
              onClick={() => setActiveTab("repository")}
              className="rounded-xl gap-2 text-sm"
            >
              <BookOpen className="size-4" /> Blogs Repository ({blogs.length})
            </Button>
            <Button
              variant={activeTab === "checklist" ? "default" : "ghost"}
              onClick={() => setActiveTab("checklist")}
              className="rounded-xl gap-2 text-sm"
            >
              <ListCheck className="size-4" /> Multi-Platform Checklist
            </Button>
            <Button
              variant={activeTab === "repurpose" ? "default" : "ghost"}
              onClick={() => setActiveTab("repurpose")}
              className="rounded-xl gap-2 text-sm"
            >
              <Share2 className="size-4" /> Content Repurposing Hub
            </Button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative w-48 sm:w-64">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search blogs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* TAB 1: TODAY'S ACTION ITEMS */}
        {activeTab === "today" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <Clock className="size-5 text-primary" /> Today's Content Tasks & Deadlines
              </h2>
              <span className="text-xs text-muted-foreground">
                {format(new Date(), "EEEE, MMMM d, yyyy")}
              </span>
            </div>

            {todayTasksCount === 0 ? (
              <Card className="p-8 text-center bg-card/40 border-dashed">
                <CheckCircle2 className="size-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold">You're all caught up for today!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  No pending social posts or overdue blog deadlines. Check your ideas backlog to pick up your next post!
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Scheduled Social Media Micro-Content Due Today */}
                <Card className="border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Share2 className="size-4 text-sky-400" /> Social Posts Due Today ({todayTasks?.todaySocialTasks.length || 0})
                    </CardTitle>
                    <CardDescription>
                      Post these micro-content items on X (Twitter) or LinkedIn today.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {todayTasks?.todaySocialTasks.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No social media posts scheduled for today.</p>
                    ) : (
                      todayTasks?.todaySocialTasks.map((task) => (
                        <div
                          key={task.repurposeId}
                          className="p-3.5 rounded-xl border border-border/50 bg-card/60 flex items-start justify-between gap-3"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon(task.platform)}
                              <span className="font-semibold text-sm truncate">{task.title}</span>
                              <Badge variant="outline" className="text-[10px]">
                                {task.contentType}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 bg-muted/40 p-2 rounded-md font-mono mt-1">
                              {task.copyContent || "No copy text added yet."}
                            </p>
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                              <BookOpen className="size-3" /> From blog: <span className="font-medium text-foreground">{task.blogTitle}</span>
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/30 text-xs shrink-0 rounded-lg"
                            onClick={() =>
                              updateRepurposedContent(task.blogId, task.repurposeId, {
                                status: "posted",
                              })
                            }
                          >
                            Mark Posted
                          </Button>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Blogs Due Today & Pending Platforms */}
                <div className="space-y-6">
                  {/* Blog Deadlines */}
                  <Card className="border-border/60">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="size-4 text-amber-500" /> Blog Deadlines Today ({todayTasks?.blogsDueToday.length || 0})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {todayTasks?.blogsDueToday.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No blog post deadlines scheduled for today.</p>
                      ) : (
                        todayTasks?.blogsDueToday.map((blog) => (
                          <div
                            key={blog.blogId}
                            className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-center justify-between"
                          >
                            <div>
                              <span className="font-semibold text-sm">{blog.blogTitle}</span>
                              <div className="mt-1">{getStatusBadge(blog.status)}</div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const b = blogs.find((item) => item._id === blog.blogId);
                                if (b) handleOpenEdit(b);
                              }}
                            >
                              Edit Blog
                            </Button>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  {/* Pending Cross-Posting Checklists */}
                  <Card className="border-border/60">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Globe className="size-4 text-primary" /> Pending Cross-Posting ({todayTasks?.pendingPublishingItems.length || 0})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {todayTasks?.pendingPublishingItems.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">All published blogs are cross-posted everywhere!</p>
                      ) : (
                        todayTasks?.pendingPublishingItems.map((item) => (
                          <div key={item.blogId} className="p-3 rounded-xl border border-border/50 bg-card/60 space-y-2">
                            <span className="font-semibold text-sm">{item.blogTitle}</span>
                            <div className="flex flex-wrap gap-1.5">
                              {item.platforms.map((p) => (
                                <Badge
                                  key={p._id}
                                  variant="outline"
                                  className="text-xs cursor-pointer hover:bg-emerald-500/10 hover:text-emerald-500"
                                  onClick={() =>
                                    togglePlatform(item.blogId, {
                                      platformId: p._id,
                                      isPublished: true,
                                    })
                                  }
                                >
                                  Publish to {p.platform}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: IDEAS BACKLOG */}
        {activeTab === "ideas" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <Sparkles className="size-5 text-amber-500" /> Blog Ideas Backlog
              </h2>
              <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-2">
                <Plus className="size-4" /> Add Idea
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {blogs
                .filter((b) => b.status === "idea")
                .map((idea) => (
                  <Card key={idea._id} className="hover:border-amber-500/40 transition-all flex flex-col justify-between">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base font-semibold">{idea.title}</CardTitle>
                        {getStatusBadge(idea.status)}
                      </div>
                      <CardDescription className="line-clamp-3 text-xs mt-1">
                        {idea.description || "No description provided."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      {idea.dueDate && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="size-3.5 text-amber-500" /> Target Date:{" "}
                          <span className="font-medium text-foreground">
                            {format(new Date(idea.dueDate), "MMM d, yyyy")}
                          </span>
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-border/40">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs gap-1"
                          onClick={() => updateBlog(idea._id, { status: "drafting" })}
                        >
                          <Edit3 className="size-3.5" /> Start Drafting
                        </Button>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => handleOpenEdit(idea)}
                          >
                            <Edit3 className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive"
                            onClick={() => setDeleteBlogId(idea._id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}

        {/* TAB 3: BLOGS REPOSITORY */}
        {activeTab === "repository" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <BookOpen className="size-5 text-primary" /> All Written & Active Blogs
              </h2>
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-background border border-border/50 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="idea">Ideas</option>
                  <option value="drafting">Drafting</option>
                  <option value="written">Written</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {blogs.map((blog) => (
                <Card key={blog._id} className="hover:border-primary/40 transition-all">
                  <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-bold text-lg">{blog.title}</span>
                        {getStatusBadge(blog.status)}
                        {blog.dueDate && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1 bg-muted/40 px-2 py-0.5 rounded-md">
                            <Calendar className="size-3 text-primary" />
                            {format(new Date(blog.dueDate), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {blog.description || "No summary added."}
                      </p>
                      {blog.tags && blog.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {blog.tags.map((tag, i) => (
                            <span key={i} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEdit(blog)}
                        className="gap-1.5 text-xs rounded-xl"
                      >
                        <Edit3 className="size-3.5" /> Edit Content
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRepurposeBlogId(blog._id);
                        }}
                        className="gap-1.5 text-xs rounded-xl"
                      >
                        <Share2 className="size-3.5" /> Repurpose
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteBlogId(blog._id)}
                        className="size-8 text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: MULTI-PLATFORM PUBLISHING CHECKLIST */}
        {activeTab === "checklist" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                  <ListCheck className="size-5 text-emerald-500" /> Multi-Platform Cross-Posting Checklist
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Track where each blog post has been published across platforms and manage live links.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {blogs.map((blog) => (
                <Card key={blog._id} className="border-border/60">
                  <CardHeader className="pb-3 border-b border-border/40">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-base font-bold">{blog.title}</CardTitle>
                        {getStatusBadge(blog.status)}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCustomPlatformBlogId(blog._id)}
                        className="text-xs gap-1 rounded-xl"
                      >
                        <Plus className="size-3.5" /> Add Platform
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {blog.publishingChecklist?.map((platformItem) => (
                        <div
                          key={platformItem._id}
                          className={`p-3 rounded-xl border transition-all space-y-2 ${
                            platformItem.isPublished
                              ? "border-emerald-500/30 bg-emerald-500/5"
                              : "border-border/50 bg-card/60"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm flex items-center gap-1.5">
                              {getPlatformIcon(platformItem.platform)}
                              {platformItem.platform}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() =>
                                  togglePlatform(blog._id, {
                                    platformId: platformItem._id,
                                    isPublished: !platformItem.isPublished,
                                  })
                                }
                                className="cursor-pointer"
                              >
                                {platformItem.isPublished ? (
                                  <CheckSquare className="size-5 text-emerald-500" />
                                ) : (
                                  <Square className="size-5 text-muted-foreground hover:text-primary" />
                                )}
                              </button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-6 text-destructive"
                                onClick={() =>
                                  deleteCustomPlatform(blog._id, platformItem._id)
                                }
                              >
                                <Trash2 className="size-3" />
                              </Button>
                            </div>
                          </div>

                          {platformItem.isPublished ? (
                            <div className="space-y-1">
                              <Input
                                placeholder="Paste published URL..."
                                defaultValue={platformItem.publishedUrl || ""}
                                onBlur={(e) =>
                                  togglePlatform(blog._id, {
                                    platformId: platformItem._id,
                                    publishedUrl: e.target.value,
                                  })
                                }
                                className="h-7 text-xs rounded-lg"
                              />
                              {platformItem.publishedUrl && (
                                <a
                                  href={platformItem.publishedUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] text-primary hover:underline flex items-center gap-1 pt-0.5"
                                >
                                  <ExternalLink className="size-3" /> View Live Post
                                </a>
                              )}
                            </div>
                          ) : (
                            <p className="text-[10px] text-muted-foreground italic">Not published yet</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: CONTENT REPURPOSING HUB */}
        {activeTab === "repurpose" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                  <Share2 className="size-5 text-sky-400" /> Content Repurposing Hub
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Generate and track X posts, threads, LinkedIn articles, and newsletters from your blog posts.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {blogs.map((blog) => (
                <Card key={blog._id} className="border-border/60">
                  <CardHeader className="pb-3 border-b border-border/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-base font-bold">{blog.title}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {blog.repurposedContent?.length || 0} Social Items
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setRepurposeBlogId(blog._id)}
                        className="text-xs gap-1.5 rounded-xl"
                      >
                        <Plus className="size-3.5" /> Create Social Item
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    {blog.repurposedContent?.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic py-2">
                        No micro-content items created for this blog post yet. Click "Create Social Item" to draft X threads or LinkedIn posts!
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {blog.repurposedContent?.map((item) => (
                          <div
                            key={item._id}
                            className="p-3.5 rounded-xl border border-border/50 bg-card/60 space-y-2 flex flex-col justify-between"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {getPlatformIcon(item.platform)}
                                  <span className="font-semibold text-sm">{item.title}</span>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={
                                    item.status === "posted"
                                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                      : "bg-muted text-muted-foreground"
                                  }
                                >
                                  {item.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground bg-muted/40 p-2 rounded-lg font-mono whitespace-pre-wrap">
                                {item.copyContent || "No copy text added."}
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-border/30 text-xs">
                              {item.dueDate ? (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Calendar className="size-3" />
                                  Due: {format(new Date(item.dueDate), "MMM d, yyyy")}
                                </span>
                              ) : (
                                <span className="text-[10px] text-muted-foreground">No due date</span>
                              )}

                              <div className="flex items-center gap-1">
                                {item.status !== "posted" && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-emerald-500 hover:text-emerald-600 text-xs h-7 px-2"
                                    onClick={() =>
                                      updateRepurposedContent(blog._id, item._id, {
                                        status: "posted",
                                      })
                                    }
                                  >
                                    Mark Posted
                                  </Button>
                                )}
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-7 text-destructive"
                                  onClick={() =>
                                    deleteRepurposedContent(blog._id, item._id)
                                  }
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* MODAL: CREATE BLOG / IDEA */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Add New Blog or Idea</DialogTitle>
              <DialogDescription>
                Capture a new blog topic idea or prepare a full blog entry with target deadlines.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateBlog} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="title">Blog Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g. How I Built a Multi-Platform Portfolio CMS"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="desc">Summary / Description</Label>
                <Textarea
                  id="desc"
                  placeholder="Key concepts, thesis, or main takeaways..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="rounded-xl min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="status">Initial Status</Label>
                  <select
                    id="status"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full bg-background border border-border/50 rounded-xl px-3 py-2 text-sm"
                  >
                    <option value="idea">💡 Idea</option>
                    <option value="drafting">✍️ Drafting</option>
                    <option value="written">📝 Written</option>
                    <option value="published">🚀 Published</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dueDate">Target Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  placeholder="react, webdev, architecture"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button type="submit" className="rounded-xl">
                  Save Blog Idea
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* MODAL: EDIT BLOG CONTENT */}
        <Dialog open={!!editingBlog} onOpenChange={() => setEditingBlog(null)}>
          <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Edit Blog Content</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Summary / Short Description</Label>
                <Input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full bg-background border border-border/50 rounded-xl px-3 py-2 text-sm"
                  >
                    <option value="idea">💡 Idea</option>
                    <option value="drafting">✍️ Drafting</option>
                    <option value="written">📝 Written</option>
                    <option value="published">🚀 Published</option>
                    <option value="archived">📦 Archived</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Blog Content (Markdown / MDX Body)</Label>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="# Write your blog in markdown format here..."
                  className="min-h-[220px] font-mono text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Tags (comma separated)</Label>
                <Input
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <DialogFooter className="pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditingBlog(null)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} className="rounded-xl">
                  Save Changes
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* MODAL: ADD CUSTOM PLATFORM */}
        <Dialog
          open={!!customPlatformBlogId}
          onOpenChange={() => setCustomPlatformBlogId(null)}
        >
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Add Custom Platform</DialogTitle>
              <DialogDescription>
                Add a new publishing destination to this blog's cross-posting checklist.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Platform Name</Label>
                <Input
                  placeholder="e.g. Medium, Substack, Hackernoon, LinkedIn Article"
                  value={customPlatformName}
                  onChange={(e) => setCustomPlatformName(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCustomPlatformBlogId(null)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button onClick={handleAddPlatform} className="rounded-xl">
                  Add Platform
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* MODAL: CREATE REPURPOSED SOCIAL CONTENT */}
        <Dialog
          open={!!repurposeBlogId}
          onOpenChange={() => setRepurposeBlogId(null)}
        >
          <DialogContent className="sm:max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Create Repurposed Social Content</DialogTitle>
              <DialogDescription>
                Draft micro-content for X (Twitter), LinkedIn, or Newsletter based on this blog.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Title / Headline *</Label>
                <Input
                  placeholder="e.g. X Thread: 5 Lessons from Building Portfolio OS"
                  value={repurposeTitle}
                  onChange={(e) => setRepurposeTitle(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Platform</Label>
                  <select
                    value={repurposePlatform}
                    onChange={(e) => setRepurposePlatform(e.target.value as any)}
                    className="w-full bg-background border border-border/50 rounded-xl px-3 py-2 text-sm"
                  >
                    <option value="X (Twitter)">X (Twitter)</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Newsletter">Newsletter</option>
                    <option value="YouTube">YouTube</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>Content Type</Label>
                  <select
                    value={repurposeType}
                    onChange={(e) => setRepurposeType(e.target.value as any)}
                    className="w-full bg-background border border-border/50 rounded-xl px-3 py-2 text-sm"
                  >
                    <option value="post">Single Post</option>
                    <option value="thread">Multi-Tweet Thread</option>
                    <option value="article">Long Article</option>
                    <option value="carousel">Slide Carousel</option>
                    <option value="script">Video Script</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Scheduled Date</Label>
                <Input
                  type="date"
                  value={repurposeDueDate}
                  onChange={(e) => setRepurposeDueDate(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Copy Text / Post Content</Label>
                <Textarea
                  placeholder="Write tweet thread or LinkedIn copy here..."
                  value={repurposeCopy}
                  onChange={(e) => setRepurposeCopy(e.target.value)}
                  className="min-h-[120px] font-mono text-xs rounded-xl"
                />
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setRepurposeBlogId(null)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button onClick={handleAddRepurposed} className="rounded-xl">
                  Create Content Task
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* DELETE CONFIRM DIALOG */}
        <ConfirmDeleteDialog
          open={!!deleteBlogId}
          onOpenChange={() => setDeleteBlogId(null)}
          onConfirm={() => {
            if (deleteBlogId) {
              deleteBlog(deleteBlogId);
              setDeleteBlogId(null);
            }
          }}
          title="Delete Blog Post?"
          description="Are you sure you want to delete this blog post and all its social micro-content tasks? This action cannot be undone."
        />
          </div>
        </PageWrapper>
      </main>
    </div>
  );
}
