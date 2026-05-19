import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function MessageBubbleSkeleton({ own }: { own?: boolean }) {
  return (
    <div className={cn("flex items-end gap-2", own ? "flex-row-reverse" : "flex-row")}>
      {!own && <Skeleton className="h-8 w-8 shrink-0 rounded-full" />}
      <div className={cn("space-y-1", own ? "items-end" : "items-start")}>
        <Skeleton className={cn("h-10 rounded-2xl", own ? "w-48" : "w-56")} />
      </div>
    </div>
  );
}

export function MessageListSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <MessageBubbleSkeleton />
      <MessageBubbleSkeleton own />
      <MessageBubbleSkeleton />
      <MessageBubbleSkeleton />
      <MessageBubbleSkeleton own />
    </div>
  );
}
