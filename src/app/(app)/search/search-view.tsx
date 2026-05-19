"use client";

import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal, X, SearchX, Loader2 } from "lucide-react";
import { SearchBar } from "@/components/features/items/search-bar";
import { FilterPanel } from "@/components/features/items/filter-panel";
import { ItemCard } from "@/components/features/items/item-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ItemCardSkeletonGrid } from "@/components/shared/loading-skeletons/item-card-skeleton";
import { Button } from "@/components/ui/button";
import { useItemFilters } from "@/hooks/use-item-filters";
import { useItems } from "@/hooks/use-items";
import { useDebounce } from "@/hooks/use-debounce";
import type { ItemWithUser } from "@/types/items";

export function SearchView() {
  const [filters, setFilters, resetFilters] = useItemFilters();
  const [localSearch, setLocalSearch] = useState(filters.search ?? "");
  const [showFilters, setShowFilters] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 400 ms: enough to avoid hammering the DB on every keystroke while still
  // feeling snappy. The spinner in SearchBar gives instant visual feedback.
  const debouncedSearch = useDebounce(localSearch, 400);
  const isPendingDebounce = localSearch !== debouncedSearch;

  // Sync debounced search into URL params
  useEffect(() => {
    setFilters({ search: debouncedSearch || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const activeFilters = { ...filters, search: debouncedSearch || undefined };
  const { data, isLoading, isFetching, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useItems(activeFilters);

  const items: ItemWithUser[] = data?.items ?? [];
  const hasActiveFilters =
    !!localSearch ||
    (filters.type && filters.type !== "all") ||
    !!filters.category?.length ||
    !!filters.dateFrom ||
    !!filters.dateTo;

  // Intersection observer for infinite scroll (only active when browsing, not searching)
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  function handleReset() {
    setLocalSearch("");
    resetFilters();
  }

  // The search query that's been sent to the server (not the local input value)
  const committedQuery = debouncedSearch;

  return (
    <div>
      {/* Sticky header */}
      <div className="sticky top-0 z-10 border-b border-border-default bg-bg-base/95 px-4 pb-3 pt-4 backdrop-blur-md">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex-1">
            <SearchBar
              value={localSearch}
              onChange={setLocalSearch}
              placeholder="Search by title, location, category…"
              isSearching={isPendingDebounce}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFilters((v) => !v)}
            aria-label={showFilters ? "Hide filters" : "Show filters"}
            aria-expanded={showFilters}
            className="shrink-0"
          >
            {showFilters ? <X size={20} /> : <SlidersHorizontal size={20} />}
          </Button>
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5">
            {localSearch && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
                &ldquo;{localSearch}&rdquo;
                {isPendingDebounce && (
                  <Loader2 size={10} className="animate-spin opacity-60" aria-hidden="true" />
                )}
              </span>
            )}
            {filters.type && filters.type !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-bg-subtle px-2.5 py-1 text-xs font-medium capitalize text-text-secondary">
                {filters.type}
              </span>
            )}
            {filters.category?.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1 rounded-full bg-bg-subtle px-2.5 py-1 text-xs font-medium capitalize text-text-secondary"
              >
                {c}
              </span>
            ))}
            <button
              onClick={handleReset}
              className="ml-1 text-xs text-text-muted-fg underline hover:text-text-secondary"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      <div className="px-4 pb-6 pt-4">
        {/* Filter panel */}
        {showFilters && (
          <div className="mb-4 animate-fade-in">
            <FilterPanel filters={filters} onChange={setFilters} onReset={handleReset} />
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <ItemCardSkeletonGrid count={6} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<SearchX size={32} className="text-text-muted-fg" aria-hidden="true" />}
            title={
              committedQuery ? `No results for "${committedQuery}"` : "No items match your filters"
            }
            description={
              committedQuery
                ? "Try different keywords, check for typos, or broaden your search."
                : "Try removing some filters to see more results."
            }
            action={hasActiveFilters ? { label: "Clear filters", onClick: handleReset } : undefined}
          />
        ) : (
          <>
            {/* Result count + refetch indicator */}
            <div className="mb-3 flex items-center gap-2">
              <p className="text-xs text-text-muted-fg">
                {committedQuery ? (
                  <>
                    <span className="font-medium text-text-secondary">{items.length}</span>
                    {hasNextPage ? "+" : ""} result{items.length !== 1 ? "s" : ""} for{" "}
                    <span className="font-medium text-text-secondary">
                      &ldquo;{committedQuery}&rdquo;
                    </span>
                  </>
                ) : (
                  <>
                    {items.length}
                    {hasNextPage ? "+" : ""} item{items.length !== 1 ? "s" : ""}
                  </>
                )}
              </p>
              {isFetching && !isFetchingNextPage && !isLoading && (
                <Loader2
                  size={12}
                  className="animate-spin text-text-muted-fg"
                  aria-label="Updating results"
                />
              )}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {items.map((item) => (
                <ItemCard key={item.id} item={item} searchQuery={committedQuery || undefined} />
              ))}
            </div>

            <div ref={sentinelRef} aria-hidden="true" />
            {isFetchingNextPage && (
              <div className="flex justify-center py-8">
                <Loader2 size={24} className="animate-spin text-text-muted-fg" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
