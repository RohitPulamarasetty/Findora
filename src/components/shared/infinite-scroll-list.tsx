"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface InfiniteScrollListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  emptyState: React.ReactNode;
  className?: string;
}

export function InfiniteScrollList<T>({
  items,
  renderItem,
  onLoadMore,
  hasMore,
  isLoading,
  emptyState,
  className,
}: InfiniteScrollListProps<T>) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  if (!isLoading && items.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <div className={className}>
      {items.map((item, i) => renderItem(item, i))}
      <div ref={sentinelRef} aria-hidden="true" />
      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 size={24} className="animate-spin text-text-muted-fg" />
        </div>
      )}
    </div>
  );
}
