import { Skeleton } from "@/components/ui/skeleton";

export function FlagRowSkeleton() {
  return (
    <div className="rounded-xl border border-border-default bg-bg-base p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          {/* Reason badge + item title */}
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-36" />
          </div>
          {/* Notes line */}
          <Skeleton className="h-3 w-3/4" />
          {/* Reporter + date */}
          <Skeleton className="h-3 w-40" />
        </div>
        {/* Resolve button */}
        <Skeleton className="h-8 w-20 shrink-0 rounded-lg" />
      </div>
    </div>
  );
}
