"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { useIdeaStore } from "@/store/use-idea-store";
import { LoginScreen } from "@/components/auth/login-screen";
import { Sidebar } from "@/components/layout/sidebar";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Lightbulb, 
  CheckSquare, 
  Activity, 
  TrendingUp,
  ArrowRight,
  Clock,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const { isAuthenticated, user } = useAuthStore();
  const { ideas, fetchIdeas, isLoading } = useIdeaStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchIdeas();
    }
  }, [isAuthenticated, fetchIdeas]);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const activeIdeas = ideas.filter(i => i.status !== "shipped" && i.status !== "paused");
  const buildingIdeas = ideas.filter(i => i.status === "building");
  const recentIdeas = [...ideas].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 3);

  return (
    <div className="flex h-screen bg-background overflow-hidden animate-in fade-in duration-700">
      <Sidebar />
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <PageWrapper className="py-8 md:py-12">
          <div className="flex flex-col gap-8 max-w-6xl mx-auto">
            {/* Welcome Section */}
            <header className="flex flex-col space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">System Status: <span className="text-primary underline decoration-primary/30 font-mono uppercase">Operational</span></h1>
              <p className="text-muted-foreground italic">Welcome back, {user?.name || "Chief"}. Build something great today.</p>
            </header>

            {/* Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="Active Ideas" 
                value={activeIdeas.length.toString()} 
                icon={<Lightbulb className="size-5" />} 
                description={`${buildingIdeas.length} in 'Building' phase`}
                href="/ideas"
              />
              <StatCard 
                title="Pending Tasks" 
                value="7" 
                icon={<CheckSquare className="size-5" />} 
                description="Todo module coming soon"
                href="/tasks"
              />
              <StatCard 
                title="Updates Logged" 
                value={ideas.reduce((acc, i) => acc + i.updates.length, 0).toString()} 
                icon={<Activity className="size-5" />} 
                description="Total project progress"
                href="/updates"
              />
              <StatCard 
                title="Current Streak" 
                value="14 Days" 
                icon={<TrendingUp className="size-5" />} 
                description="Streak tracker active"
                href="/streaks"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               {/* Recently Updated Ideas */}
               <Card className="lg:col-span-2 shadow-sm border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-muted/20">
                    <div>
                      <CardTitle>Recent Ideas</CardTitle>
                      <CardDescription>Your latest visions and captures.</CardDescription>
                    </div>
                    <Link href="/ideas">
                      <Button variant="ghost" size="sm" className="text-xs gap-1 hover:text-primary">
                        View All <ExternalLink className="size-3" />
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent className="p-0">
                     {recentIdeas.length > 0 ? (
                        <div className="divide-y divide-border/50">
                           {recentIdeas.map((idea) => (
                              <Link key={idea._id} href={`/ideas/${idea._id}`} className="flex items-center justify-between p-5 hover:bg-primary/5 transition-colors group">
                                 <div className="space-y-1">
                                    <div className="font-semibold group-hover:text-primary transition-colors">{idea.title}</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                                       <Badge variant="outline" className="text-[10px] uppercase font-bold py-0">{idea.status}</Badge>
                                       <span>•</span>
                                       <Clock className="size-3" />
                                       <span>Updated {new Date(idea.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                 </div>
                                 <ArrowRight className="size-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                              </Link>
                           ))}
                        </div>
                     ) : (
                        <div className="flex items-center justify-center py-20 text-muted-foreground italic">
                           No ideas captured yet.
                        </div>
                     )}
                  </CardContent>
               </Card>

               {/* Command Center Quick Actions */}
               <Card className="shadow-sm border-border/50 bg-card/30 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Command Center</CardTitle>
                    <CardDescription>Quick actions for daily use.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ActionButton title="New Idea" icon={<Lightbulb className="size-4" />} href="/ideas" />
                    <ActionButton title="Add Task" icon={<CheckSquare className="size-4" />} href="/tasks" />
                    <ActionButton title="Log Update" icon={<Activity className="size-4" />} href="/updates" />
                    
                    <div className="mt-8 p-4 rounded-2xl bg-primary/10 border border-primary/20">
                       <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Quote of the Day</p>
                       <p className="text-sm italic font-serif">"The best way to predict the future is to create it."</p>
                    </div>
                  </CardContent>
               </Card>
            </div>
          </div>
        </PageWrapper>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, description, href }: { title: string, value: string, icon: React.ReactNode, description: string, href: string }) {
  return (
    <Link href={href} className="group cursor-pointer">
      <Card className="h-full border-border/50 bg-card/50 hover:border-primary/30 hover:shadow-md transition-all">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function ActionButton({ title, icon, href }: { title: string, icon: React.ReactNode, href: string }) {
  return (
    <Link href={href}>
      <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/50 bg-background/50 hover:bg-primary/5 hover:border-primary/20 transition-all group">
        <div className="flex items-center gap-3">
           <div className="text-muted-foreground group-hover:text-primary transition-colors">
              {icon}
           </div>
           <span className="text-sm font-medium">{title}</span>
        </div>
        <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all" />
      </div>
    </Link>
  );
}
