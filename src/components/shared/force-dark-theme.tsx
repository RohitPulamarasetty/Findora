"use client";

import { ThemeProvider } from "next-themes";

/**
 * Forces `dark` on every descendant route, ignoring system preference and
 * any persisted `theme` value in localStorage. Used for public/marketing
 * surfaces and the auth gate so guests always see the cinematic dark
 * experience — the authenticated app keeps the normal theme system.
 *
 * Works as a *nested* ThemeProvider: the outer provider in `app/providers.tsx`
 * continues to manage the authenticated app, and this inner provider takes
 * over only inside the (public) / (auth) subtrees. `forcedTheme` is the
 * supported next-themes API for this exact scenario, so no extra global
 * state, no flicker hacks, no localStorage writes.
 */
export function ForceDarkTheme({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" forcedTheme="dark" enableSystem={false}>
      {children}
    </ThemeProvider>
  );
}
