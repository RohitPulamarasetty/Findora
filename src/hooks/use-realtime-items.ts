"use client";

/**
 * useRealtimeItems — global item-lifecycle subscription for feed pages.
 *
 * Subscribes to the `items` table (no row filter — receives events for every
 * item the authenticated user can read via RLS) and surgically updates the
 * TanStack Query cache:
 *
 *  INSERT  → debounced invalidate (500 ms). Surgical prepend is not feasible
 *            because realtime INSERT payloads lack join data (user, images) and
 *            cannot respect the caller's active filters without a server round-
 *            trip anyway. One invalidation per burst is fine and cheap.
 *
 *  UPDATE (non-terminal) → Object.assign patch in-place. Preserves existing
 *            join data (user, images) that the realtime payload doesn't carry.
 *
 *  UPDATE (terminal status) → evict from all list caches immediately.
 *
 *  DELETE  → evict by id (payload.old carries the PK with DEFAULT REPLICA
 *            IDENTITY).
 *
 * Returns { refresh } — a stable callback that invalidates all items list
 * queries, used by the manual refresh button and the tab-visibility refetch.
 *
 * ── Why no filter? ────────────────────────────────────────────────────────
 * Feed pages show items from all users. A filter like `user_id=eq.<mine>`
 * would only catch the current user's own changes; other users' items would
 * stay stale until the next staleTime expiry. Subscribing table-wide lets
 * us update any item instantly.
 *
 * Scale note: for a campus-scoped deployment (hundreds to low-thousands of
 * items, O(10s) of concurrent users), the event volume is negligible.
 */
import { useEffect, useRef, useCallback } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import type { ItemWithUser } from "@/types/items";

interface ItemsPage {
  items: ItemWithUser[];
  nextCursor: string | null;
}

// Extended interface matching the actual `items` table columns that the
// realtime payload may carry. Only scalar columns — joins (user, images) are
// never present in realtime payloads, so we never overwrite them.
interface ItemChangeRow {
  id?: string;
  user_id?: string;
  type?: string;
  category?: string;
  title?: string;
  description?: string;
  location?: string;
  date_occurred?: string;
  status?: string;
  verification_questions?: string[];
  auto_hidden?: boolean;
  flag_count?: number;
  resolved_at?: string | null;
  resolved_by?: string | null;
  resolution_note?: string | null;
  handover_confirmed?: boolean;
  updated_at?: string;
  created_at?: string;
}

const TERMINAL_STATUSES = new Set(["removed", "closed", "expired", "completed", "resolved"]);

// Coalesce rapid bulk-insert bursts (e.g. seeding) into a single invalidation.
const INSERT_DEBOUNCE_MS = 500;

export function useRealtimeItems() {
  const queryClient = useQueryClient();
  // Stable ref so effect callbacks never close over a stale queryClient.
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;

  const insertDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const evictItem = useCallback((id: string) => {
    queryClientRef.current.setQueriesData<InfiniteData<ItemsPage>>(
      { queryKey: queryKeys.items.lists() },
      (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.filter((item) => item.id !== id),
          })),
        };
      }
    );
  }, []);

  const patchItem = useCallback((id: string, next: ItemChangeRow) => {
    queryClientRef.current.setQueriesData<InfiniteData<ItemsPage>>(
      { queryKey: queryKeys.items.lists() },
      (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.id !== id
                ? item
                : // Object.assign preserves join fields (user, images) that the
                  // realtime payload doesn't carry; only scalar columns are merged.
                  (Object.assign({}, item, next) as ItemWithUser)
            ),
          })),
        };
      }
    );
  }, []);

  // Stable refresh callback — invalidates all items list queries so TanStack
  // Query refetches the server without resetting infinite-scroll state.
  const refresh = useCallback((): Promise<void> => {
    return queryClientRef.current.invalidateQueries({
      queryKey: queryKeys.items.lists(),
    });
  }, []);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("items-global-lifecycle")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "items" }, (payload) => {
        const next = payload.new as ItemChangeRow;
        // Ignore non-active inserts (e.g. items created in draft state).
        if (next.status !== "active") return;

        // Debounce: coalesce rapid inserts into a single invalidation.
        if (insertDebounceRef.current !== null) clearTimeout(insertDebounceRef.current);
        insertDebounceRef.current = setTimeout(() => {
          insertDebounceRef.current = null;
          void queryClientRef.current.invalidateQueries({
            queryKey: queryKeys.items.lists(),
          });
        }, INSERT_DEBOUNCE_MS);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "items" }, (payload) => {
        const next = payload.new as ItemChangeRow;
        if (!next.id) return;

        if (next.status && TERMINAL_STATUSES.has(next.status)) {
          // Item left the active feed — remove it immediately.
          evictItem(next.id);
        } else {
          // Item still active — patch scalar fields in-place so the card
          // reflects the latest title/description/location without a full
          // refetch or scroll disruption.
          patchItem(next.id, next);
        }
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "items" }, (payload) => {
        // payload.old carries at minimum the PK with DEFAULT REPLICA IDENTITY.
        const old = payload.old as ItemChangeRow;
        if (old.id) evictItem(old.id);
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
      if (insertDebounceRef.current !== null) {
        clearTimeout(insertDebounceRef.current);
        insertDebounceRef.current = null;
      }
    };
  }, [evictItem, patchItem]); // stable callbacks — effect runs once

  return { refresh };
}
