"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Github, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/#features" },
  { label: "Documentation", href: "https://nextjs.org/docs" },
];

/**
 * Responsive Navbar with sticky header, dark mode support, and mobile drawer.
 */
export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Desktop Brand */}
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <div className="size-6 rounded-md bg-primary flex items-center justify-center">
              <div className="size-3 bg-primary-foreground transform rotate-45" />
            </div>
            <span className="hidden font-bold sm:inline-block">
              Skyline <span className="text-primary">Starter</span>
            </span>
          </Link>
          <div className="hidden md:flex gap-6 uppercase text-[11px] font-bold tracking-widest text-muted-foreground/80">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-foreground",
                  pathname === item.href ? "text-foreground" : ""
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Global Search / Extras */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="hidden sm:flex">
            <Link href="https://github.com" target="_blank">
              <Github className="size-4" />
            </Link>
          </Button>
          <Button size="sm" className="h-8 rounded-full px-4">
            Get Started
          </Button>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="flex flex-col gap-6 pt-12">
                <SheetHeader className="text-left mb-6">
                  <SheetTitle>Skyline UI</SheetTitle>
                </SheetHeader>
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "text-lg font-medium transition-colors hover:text-primary",
                      pathname === item.href ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
}
