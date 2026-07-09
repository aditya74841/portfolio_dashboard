
"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "sonner";
import { useAuthStore } from "@/store/use-auth-store";

export function Providers({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);

  React.useEffect(() => {
    const defaultIcon = "/favicon.ico";
    const iconUrl = user?.avatar || defaultIcon;

    // Safely update existing link tags rather than removing them, 
    // which prevents React "removeChild on null" errors during re-renders.
    const links = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']");
    
    if (links.length > 0) {
      links.forEach((link) => {
        link.href = iconUrl;
      });
    } else {
      // Create a fresh link element if none exist
      const newLink = document.createElement("link");
      newLink.rel = "icon";
      newLink.href = iconUrl;
      document.head.appendChild(newLink);
    }
  }, [user?.avatar]);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {/* The Toaster sits here globally. 
        'richColors' makes success/error toasts look professional instantly.
      */}
      <Toaster 
        position="top-right" 
        richColors 
        closeButton 
        theme="system"
      />
      
      {children}
    </NextThemesProvider>
  );
}