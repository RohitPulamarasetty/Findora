"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cached responses stay "fresh" for 60s before being marked stale.
            staleTime: 60 * 1000,
            // Keep cached data around for 10 min after the last subscriber
            // unmounts — makes back/forward navigation between routes feel
            // instant (no spinner on cached views).
            gcTime: 10 * 60 * 1000,
            refetchOnWindowFocus: false,
            // One retry with jittered backoff. Default is 3 — too aggressive
            // for transient errors; users prefer a clear error fast.
            retry: 1,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4_000),
          },
          mutations: {
            // Mutations should fail fast; user retries are explicit.
            retry: 0,
          },
        },
      })
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
