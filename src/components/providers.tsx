


"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
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