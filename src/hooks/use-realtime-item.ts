"use client";

/**
 * useRealtimeItem — scoped subscription to a single item row.
 *
 * Filters on `id=eq.<itemId>` so the WebSocket only delivers events for the
 * one item the user is currently viewing.
 *
 * ── Event handling ────────────────────────────────────────────────────────
 *  UPDATE → terminal status (removed | closed | expired):
 *    Fire `onRemoved` callback (toast + redirect in consumer).  These states
 *    mean the item is gone from the active flow — the detail page has nothing
 *    useful to show.
 *
 *  UPDATE → resolved/completed status:
 *    Call router.refresh() so the SSR page re-renders and shows the "Case
 *    resolved" banner.  No redirect — the page intentionally displays the
 *    closed state.
 *
 *  UPDATE → any other field change:
 *    Call router.refresh() + invalidate the TanStack Query detail cache.
 *
 *  DELETE → hard-delete (admin action):
 *    Fire `onRemoved` immediately.
 *
 * ── Stability ─────────────────────────────────────────────────────────────
 * `router` and `queryClient` are stored in refs so the subscribe effect's
 * dep array stays `[itemId]`.  This prevents the channel from tearing down
 * and re-subscribing on every parent render — a pattern that would cause
 * missed events during the brief reconnect window.
 *
 * `router.refresh()` is debounced to at most once per 1 000 ms.  Rapid
 * upstream changes (e.g. image upload triggers an item UPDATE during every
 * file upload) would otherwise stack O(n) full SSR round-trips.
 */
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { queryKeys } from "@/lib/query-keys";

interface ItemRealtimeRow {
  id?: string;
  status?: string;
  auto_hidden?: boolean;
}

// Statuses that mean the item is no longer accessible to regular users.
// Detail page should redirect away when any of these arrive.
const TERMINAL_STATUSES = new Set(["removed", "closed", "expired"]);

interface UseRealtimeItemOptions {
  /** Fired on hard DELETE or when status flips to a terminal value. */
  onRemoved?: () => void;
}

export function useRealtimeItem(itemId: string | undefined, options: UseRealtimeItemOptions = {}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Stable refs — updated on every render but never referenced in the dep
  // array so the subscription is set up exactly once per itemId.
  const routerRef = useRef(router);
  routerRef.current = router;
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Debounce handle for router.refresh() — cleared in effect cleanup.
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!itemId) return;
    const supabase = createClient();

    const scheduleRefresh = () => {
      if (refreshTimerRef.current !== null) return; // already scheduled
      refreshTimerRef.current = setTimeout(() => {
        refreshTimerRef.current = null;
        routerRef.current.refresh();
        void queryClientRef.current.invalidateQueries({
          queryKey: queryKeys.items.detail(itemId),
        });
      }, 300);
    };

    const channel = supabase
      .channel(`item:${itemId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "items",
          filter: `id=eq.${itemId}`,
        },
        (payload) => {
          const next = payload.new as ItemRealtimeRow | null;
          if (!next) return;

          if (next.status && TERMINAL_STATUSES.has(next.status)) {
            // Item is gone — clear any pending refresh and redirect.
            if (refreshTimerRef.current !== null) {
              clearTimeout(refreshTimerRef.current);
              refreshTimerRef.current = null;
            }
            optionsRef.current.onRemoved?.();
            return;
          }

          // Non-terminal update (completed, minor field changes): refresh the
          // server component so the page shows the latest state.
          scheduleRefresh();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "items",
          filter: `id=eq.${itemId}`,
        },
        () => {
          if (refreshTimerRef.current !== null) {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
          }
          optionsRef.current.onRemoved?.();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
      if (refreshTimerRef.current !== null) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [itemId]); // stable dep — router/queryClient/options are read via refs
}
