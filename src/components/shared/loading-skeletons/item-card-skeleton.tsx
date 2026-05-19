import { cn } from "@/lib/utils";

function Shimmer({ className }: { className?: string }) {
  return <div className={cn("skeleton-shimmer", className)} />;
}

export function ItemCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border-default bg-bg-base shadow-card">
      {/* Image area */}
      <Shimmer className="aspect-[4/3] w-full rounded-none" />
      {/* Content */}
      <div className="space-y-2.5 p-3">
        <Shimmer className="h-3.5 w-3/4 rounded-md" />
        <Shimmer className="h-3 w-1/2 rounded-md" />
        <div className="flex items-center justify-between pt-0.5">
          <Shimmer className="h-2.5 w-1/3 rounded-md" />
          <Shimmer className="h-2.5 w-1/5 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function ItemCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ItemCardSkeleton key={i} />
      ))}
    </div>
  );
}
