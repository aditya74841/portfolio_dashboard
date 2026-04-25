"use client";

import { TodoApp } from "@/components/todo-app";
import { Sidebar } from "@/components/layout/sidebar";
import { PageWrapper } from "@/components/layout/page-wrapper";

export default function TodosPage() {
  return (
    <div className="flex h-screen bg-background overflow-hidden animate-in fade-in duration-500">
      <Sidebar />
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <PageWrapper className="py-8 md:py-12">
          <div className="flex flex-col gap-8 max-w-6xl mx-auto px-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
                Daily Objectives
              </h1>
              <p className="text-muted-foreground text-lg italic">
                "Small wins lead to big victories."
              </p>
            </div>
            
            <div className="grid gap-8 items-start">
              <TodoApp />
            </div>
          </div>
        </PageWrapper>
      </main>
    </div>
  );
}
