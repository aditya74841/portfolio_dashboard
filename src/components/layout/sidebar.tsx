"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/use-auth-store";
import { 
  Lightbulb, 
  CheckSquare, 
  Activity, 
  TrendingUp, 
  LayoutDashboard,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const navItems = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/" },
  { title: "Ideas", icon: Lightbulb, href: "/ideas" },
  { title: "Tasks", icon: CheckSquare, href: "/tasks" },
  { title: "Updates", icon: Activity, href: "/updates" },
  { title: "Streaks", icon: TrendingUp, href: "/streaks" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={cn(
      "relative h-screen border-r border-border/50 bg-card/30 backdrop-blur-sm flex flex-col transition-all duration-300",
      collapsed ? "w-20" : "w-64"
    )}>
      {/* Collapse Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-4 top-10 size-8 rounded-full border bg-background shadow-sm z-10 hover:bg-primary/10"
      >
        {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
      </Button>

      {/* Brand */}
      <div className={cn(
        "p-6 flex items-center gap-3",
        collapsed ? "justify-center" : ""
      )}>
        <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
          <LayoutDashboard className="size-6" />
        </div>
        {!collapsed && <span className="font-bold text-xl tracking-tight">Portfolio OS</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/10" 
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
                collapsed ? "justify-center" : ""
              )}
            >
              <item.icon className={cn(
                "size-5 transition-transform group-hover:scale-110",
                isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
              )} />
              {!collapsed && <span className="font-medium">{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 mt-auto border-t border-border/50">
        {!collapsed && (
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="size-9 rounded-full bg-secondary flex items-center justify-center border">
              <User className="size-5 text-muted-foreground" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate">{user?.name || "Chief"}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">Developer</span>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          onClick={logout}
          className={cn(
            "w-full justify-start gap-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors",
            collapsed ? "justify-center px-0" : ""
          )}
        >
          <LogOut className="size-5" />
          {!collapsed && <span className="font-medium">Lock Session</span>}
        </Button>
      </div>
    </div>
  );
}
