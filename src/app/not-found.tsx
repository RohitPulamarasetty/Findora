import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// 404 should not be indexed (Next emits a 404 status, but we add explicit
// noindex as a defense-in-depth signal so soft-404s don't pollute the index).
export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you're looking for doesn't exist or has been moved.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <main
      role="main"
      aria-labelledby="not-found-title"
      className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center"
    >
      <div
        aria-hidden="true"
        className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border-default bg-bg-subtle shadow-sm"
      >
        <span className="text-2xl font-black text-text-muted-fg">404</span>
      </div>
      <div className="space-y-1.5">
        <h1 id="not-found-title" className="text-lg font-bold tracking-tight text-text-base">
          Page not found
        </h1>
        <p className="max-w-xs text-sm leading-relaxed text-text-muted-fg">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/" aria-label="Return to Findora homepage">
            Go to homepage
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/about" aria-label="Learn about Findora">
            About Findora
          </Link>
        </Button>
      </div>
    </main>
  );
}
