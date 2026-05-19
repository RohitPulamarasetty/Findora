import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border-default bg-bg-subtle shadow-sm">
        <span className="text-2xl font-black text-text-muted-fg">404</span>
      </div>
      <div className="space-y-1.5">
        <h1 className="text-lg font-bold tracking-tight text-text-base">Page not found</h1>
        <p className="max-w-xs text-sm leading-relaxed text-text-muted-fg">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <Button asChild variant="outline" size="sm">
        <Link href="/home">Go home</Link>
      </Button>
    </main>
  );
}
