"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Capture for telemetry (Sentry if configured, structured log otherwise).
    // Dynamic import keeps the logger out of the public-route hot bundle.
    import("@/lib/logger")
      .then(({ captureException }) =>
        captureException(error, { event: "client_error_boundary", digest: error.digest })
      )
      .catch(() => {
        // eslint-disable-next-line no-console
        console.error(error);
      });
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20">
        <AlertTriangle size={22} className="text-red-500" />
      </div>
      <div className="space-y-1.5">
        <h1 className="text-lg font-bold tracking-tight text-text-base">Something went wrong</h1>
        <p className="max-w-xs text-sm leading-relaxed text-text-muted-fg">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
