import { Skeleton } from "@/components/ui/skeleton";

export function AdminUserRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border-default bg-bg-base p-3">
      {/* Avatar */}
      <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
      {/* Name + email */}
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3 w-44" />
      </div>
      {/* Action button */}
      <Skeleton className="h-8 w-14 shrink-0 rounded-lg" />
    </div>
  );
}

export function AdminItemRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border-default bg-bg-base p-3">
      {/* Title + badges */}
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="h-4 w-10 shrink-0 rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    </div>
  );
}
