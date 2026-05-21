"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

/**
 * Theme owner for public + auth routes. Forces `dark` regardless of
 * localStorage, system preference, or any previously-saved authenticated
 * theme. Mounted in `(public)/layout.tsx` and `(auth)/layout.tsx` — this is
 * the ONLY ThemeProvider that runs there, so there is no parent provider
 * to fight with (the root layout no longer mounts a ThemeProvider).
 *
 * `forcedTheme="dark"` is the canonical next-themes API for this case:
 * it pins the html class to `dark` and does not read or write localStorage,
 * so signing out from a `theme=light` authenticated session no longer
 * carries that preference into the public experience.
 *
 * Toaster lives inside this provider so it picks up the dark theme without
 * needing a separate scoped instance.
 */
export function ForceDarkTheme({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" forcedTheme="dark" enableSystem={false}>
      {children}
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}
