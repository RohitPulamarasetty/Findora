"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

/**
 * Theme owner for the authenticated app. Reads the user's saved preference
 * from localStorage and respects system theme. Mounted ONLY inside
 * `(app)/layout.tsx` so its storage write/read is scoped to authenticated
 * surfaces and cannot leak into the public/auth routes after sign-out.
 *
 * Toaster lives inside this provider so `useTheme()` inside it returns the
 * actual active theme (no fallback flicker).
 */
export function AppTheme({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}
