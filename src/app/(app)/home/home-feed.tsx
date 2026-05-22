"use client";

import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal, X, Loader2, Package, SearchX, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchBar } from "@/components/features/items/search-bar";
import { FilterPanel } from "@/components/features/items/filter-panel";
import { ItemGrid } from "@/components/features/items/item-grid";
import { EmptyState } from "@/components/shared/empty-state";
import { ItemCardSkeletonGrid } from "@/components/shared/loading-skeletons/item-card-skeleton";
import { Button } from "@/components/ui/button";
import { useItems } from "@/hooks/use-items";
import { useRealtimeItems } from "@/hooks/use-realtime-items";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import type { ItemFilters, ItemWithUser } from "@/types/items";

const TYPE_TABS = [
  { value: "all" as const, label: "All" },
  { value: "lost" as const, label: "Lost" },
  { value: "found" as const, label: "Found" },
];

export function HomeFeed() {
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ItemFilters>({ type: "all", status: "active" });
  const sentinelRef = useRef<HTMLDivElement>(null);
  // Tracks the timestamp when the tab was hidden, so we can skip the refetch
  // if the user comes back within the grace window.
  const hiddenAtRef = useRef<number | null>(null);
  // Prevents concurrent background refetches (TanStack Query deduplicates in-
  // flight requests itself, but the flag avoids queuing a second invalidation
  // before the first one resolves).
  const refreshInFlightRef = useRef(false);

  const debouncedSearch = useDebounce(search, 400);
  const isPendingDebounce = search !== debouncedSearch;
  const activeFilters: ItemFilters = { ...filters, search: debouncedSearch || undefined };

  const { data, isLoading, isFetching, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useItems(activeFilters);

  // Live eviction + patch + INSERT invalidation. Returns a stable `refresh`
  // callback for the manual button and tab-visibility refetch below.
  const { refresh } = useRealtimeItems();
  // Keep a ref so the visibility effect never closes over a stale `refresh`.
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  const items: ItemWithUser[] = data?.items ?? [];

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

  // Tab-visibility silent refetch: when the user returns to the tab after it
  // was hidden for more than 60 seconds, silently invalidate the feed so any
  // changes made in other tabs (or on other devices) are picked up.
  // No spinner is shown — the `isFetching` indicator in the result meta row
  // provides a subtle in-flight signal without a skeleton flash or scroll reset.
  useEffect(() => {
    const HIDDEN_THRESHOLD_MS = 60_000;

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now();
      } else {
        // Tab became visible again.
        const hiddenAt = hiddenAtRef.current;
        hiddenAtRef.current = null;
        if (hiddenAt === null) return;
        const elapsed = Date.now() - hiddenAt;
        if (elapsed < HIDDEN_THRESHOLD_MS) return;
        // Tab was hidden long enough — trigger a silent background refetch.
        if (refreshInFlightRef.current) return;
        refreshInFlightRef.current = true;
        void refreshRef.current().finally(() => {
          refreshInFlightRef.current = false;
        });
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []); // no deps — reads via refs only

  function updateFilters(updates: Partial<ItemFilters>) {
    setFilters((f) => ({ ...f, ...updates }));
  }

  function resetFilters() {
    setSearch("");
    setFilters({ type: "all", status: "active" });
    setShowFilters(false);
  }

  const hasActiveFilters =
    (filters.category?.length ?? 0) > 0 || filters.dateFrom || filters.dateTo;

  return (
    <div>
      {/* ── Sticky header ────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 border-b border-border-default/70 bg-bg-base/70 backdrop-blur-2xl">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent"
        />
        {/* Brand row */}
        <div className="relative flex items-center justify-between px-4 pb-3 pt-6">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/20 bg-brand-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
              IITM DS Campus
            </p>
            <h1 className="mt-1.5 text-[26px] font-extrabold leading-tight tracking-[-0.03em] text-text-base">
              Lost <span className="gradient-brand-text">&amp;</span> Found
            </h1>
          </div>
          <div className="flex items-center gap-1">
            {/* Manual refresh — spins while a background fetch is in-flight.
                Disabled while fetching to prevent queuing concurrent requests. */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (refreshInFlightRef.current) return;
                refreshInFlightRef.current = true;
                void refresh().finally(() => {
                  refreshInFlightRef.current = false;
                });
              }}
              disabled={isFetching}
              aria-label="Refresh feed"
              className="h-9 w-9 rounded-xl text-text-muted-fg hover:bg-bg-muted-surface hover:text-text-base"
            >
              <RefreshCw
                size={15}
                className={cn(isFetching && !isFetchingNextPage && !isLoading && "animate-spin")}
              />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowFilters((v) => !v)}
              aria-label={showFilters ? "Hide filters" : "Show filters"}
              aria-expanded={showFilters}
              className={cn(
                "h-9 w-9 rounded-xl",
                showFilters || hasActiveFilters
                  ? "bg-brand-500/10 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400"
                  : "text-text-muted-fg hover:bg-bg-muted-surface hover:text-text-base"
              )}
            >
              {showFilters ? <X size={16} /> : <SlidersHorizontal size={16} />}
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-2.5">
          <SearchBar value={search} onChange={setSearch} isSearching={isPendingDebounce} />
        </div>

        {/* Segmented type control */}
        <div className="px-4 pb-3.5">
          <div className="flex gap-1 rounded-xl bg-bg-muted-surface p-1">
            {TYPE_TABS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => updateFilters({ type: value })}
                className={cn(
                  "flex-1 rounded-lg py-1.5 text-[12px] font-semibold transition-all duration-200",
                  filters.type === value
                    ? "bg-bg-subtle text-text-base shadow-sm dark:bg-bg-base"
                    : "text-text-muted-fg hover:text-text-secondary"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <div className="mt-2 flex justify-end">
              <button
                onClick={resetFilters}
                className="text-[11px] font-semibold text-brand-500 hover:underline dark:text-brand-400"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Filter panel ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-b border-border-default"
          >
            <div className="px-4 py-4">
              <FilterPanel filters={filters} onChange={updateFilters} onReset={resetFilters} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Content ──────────────────────────────────────────────── */}
      <div className="px-4 pb-6 pt-4">
        {isLoading ? (
          <ItemCardSkeletonGrid count={6} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={
              debouncedSearch ? (
                <SearchX size={28} className="text-text-muted-fg" aria-hidden="true" />
              ) : (
                <Package size={28} className="text-text-muted-fg" aria-hidden="true" />
              )
            }
            title={debouncedSearch ? `No results for "${debouncedSearch}"` : "Nothing here yet"}
            description={
              debouncedSearch
                ? "Try different keywords, check for typos, or broaden your search."
                : "Be the first to report a lost or found item on campus."
            }
            action={
              debouncedSearch
                ? { label: "Clear search", onClick: () => setSearch("") }
                : { label: "Report an item", href: "/report" }
            }
          />
        ) : (
          <>
            {/* Result meta */}
            {(debouncedSearch || hasActiveFilters) && (
              <div className="mb-3 flex items-center gap-2">
                <p className="text-xs text-text-muted-fg">
                  {debouncedSearch ? (
                    <>
                      <span className="font-semibold text-text-secondary">{items.length}</span>
                      {hasNextPage ? "+" : ""} result{items.length !== 1 ? "s" : ""} for{" "}
                      <span className="font-semibold text-text-secondary">
                        &ldquo;{debouncedSearch}&rdquo;
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
                    size={11}
                    className="animate-spin text-text-muted-fg"
                    aria-label="Updating"
                  />
                )}
              </div>
            )}

            <ItemGrid items={items} searchQuery={debouncedSearch || undefined} />
            <div ref={sentinelRef} aria-hidden="true" />

            {isFetchingNextPage && (
              <div className="flex justify-center py-8">
                <Loader2 size={18} className="animate-spin text-text-muted-fg" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
