import { Skeleton } from "@/components/ui/skeleton";

export function ClaimSectionSkeleton() {
  return (
    <div className="space-y-3 rounded-2xl border border-border-default bg-bg-subtle p-4 shadow-card">
      {/* Section header: icon + title + subtitle */}
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-8 w-8 shrink-0 rounded-xl" />
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-36" />
          <Skeleton className="h-3 w-52" />
        </div>
      </div>

      {/* Claim card */}
      <div className="space-y-3 rounded-xl border border-border-default bg-bg-base p-3.5">
        {/* Claimant avatar + name */}
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-16 rounded-full" />
          </div>
        </div>
        {/* Answer block */}
        <div className="space-y-2 rounded-lg bg-bg-subtle p-3">
          <div className="space-y-1">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-3.5 w-full" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-3.5 w-4/5" />
          </div>
        </div>
        {/* Reject / Approve buttons */}
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1 rounded-lg" />
          <Skeleton className="h-8 flex-1 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
