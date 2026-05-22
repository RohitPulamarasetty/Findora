"use client";

/**
 * useRealtimeProfile — per-user realtime subscriptions for the profile page.
 *
 * Subscribes to two filtered channels on a single Supabase subscription:
 *
 *   • `items WHERE user_id=eq.<userId>`  — INSERT / UPDATE / DELETE
 *   • `users  WHERE id=eq.<userId>`      — UPDATE (recoveries_count, full_name, etc.)
 *
 * Cache strategy (flat ItemWithUser[] — not InfiniteData):
 *
 *   INSERT  → 300 ms debounced prepend with dedup guard. Synthesises the
 *             `user` join from the cached profile row so no server round-trip
 *             is needed. Falls back to a targeted invalidation when the items
 *             cache is empty (cold page).
 *
 *   UPDATE (non-evict status) → Object.assign patch preserving join fields.
 *   UPDATE (evict status: removed | expired) → filter out by id.
 *
 *   DELETE  → filter out by id.
 *
 *   users UPDATE → Object.assign patch on the profile user cache.
 *
 * Profile EVICT_STATUSES is intentionally narrower than the feed version:
 * completed/resolved/closed items stay — they populate the "Recovered Items"
 * section. Only truly terminal/invisible statuses trigger eviction.
 *
 * Returns { refresh } — a stable callback that invalidates both profile
 * queries; used by ProfileView for the tab-visibility refetch.
 */
import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import type { ItemWithUser } from "@/types/items";
import type { ProfileUser } from "@/hooks/use-profile-user";

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

// Only evict truly invisible statuses. completed/resolved/closed stay in the
// profile cache so the "Recovered Items" section updates live.
const EVICT_STATUSES = new Set(["removed", "expired"]);

const INSERT_DEBOUNCE_MS = 300;

export function useRealtimeProfile(userId: string) {
  const queryClient = useQueryClient();
  // Stable ref — effect callbacks never close over a stale queryClient.
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;

  const insertDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Stable cache helpers ──────────────────────────────────────────────────

  const evictProfileItem = useCallback(
    (id: string) => {
      queryClientRef.current.setQueryData<ItemWithUser[]>(queryKeys.profile.items(userId), (old) =>
        old ? old.filter((i) => i.id !== id) : old
      );
    },
    [userId]
  );

  const patchProfileItem = useCallback(
    (id: string, next: ItemChangeRow) => {
      queryClientRef.current.setQueryData<ItemWithUser[]>(queryKeys.profile.items(userId), (old) =>
        old
          ? old.map((i) =>
              i.id !== id
                ? i
                : // Preserve join fields (user, images) that realtime payloads lack.
                  (Object.assign({}, i, next) as ItemWithUser)
            )
          : old
      );
    },
    [userId]
  );

  const patchProfileUser = useCallback(
    (next: Partial<ProfileUser>) => {
      queryClientRef.current.setQueryData<ProfileUser>(queryKeys.profile.user(userId), (old) =>
        old ? (Object.assign({}, old, next) as ProfileUser) : old
      );
    },
    [userId]
  );

  // Invalidate both profile queries — used by tab-visibility refresh.
  const refresh = useCallback((): Promise<void> => {
    return Promise.all([
      queryClientRef.current.invalidateQueries({
        queryKey: queryKeys.profile.items(userId),
      }),
      queryClientRef.current.invalidateQueries({
        queryKey: queryKeys.profile.user(userId),
      }),
    ]).then(() => undefined);
  }, [userId]);

  // ── Realtime subscription ─────────────────────────────────────────────────

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`profile:${userId}`)
      // ── Items: scoped to this user only ──────────────────────────────────
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "items", filter: `user_id=eq.${userId}` },
        (payload) => {
          const newItem = payload.new as ItemChangeRow;
          // Ignore immediately-evicted statuses (e.g. admin-removed on insert).
          if (!newItem.id || EVICT_STATUSES.has(newItem.status ?? "")) return;

          // Debounce: coalesce rapid bursts into one prepend.
          if (insertDebounceRef.current !== null) clearTimeout(insertDebounceRef.current);
          insertDebounceRef.current = setTimeout(() => {
            insertDebounceRef.current = null;
            const qc = queryClientRef.current;

            qc.setQueryData<ItemWithUser[]>(queryKeys.profile.items(userId), (old) => {
              if (!old) {
                // Cache is cold — trigger a proper fetch instead of synthesising.
                void qc.invalidateQueries({ queryKey: queryKeys.profile.items(userId) });
                return old;
              }
              // Dedup guard: skip if already present (realtime can fire twice on
              // reconnect or after an optimistic mutation).
              if (old.some((i) => i.id === newItem.id)) return old;

              // Synthesise the user join from the cached profile row so we
              // don't need a server round-trip to get full_name / avatar_url.
              const cachedUser = qc.getQueryData<ProfileUser>(queryKeys.profile.user(userId));
              const synthetic = {
                ...newItem,
                user: cachedUser
                  ? {
                      id: cachedUser.id,
                      full_name: cachedUser.full_name,
                      avatar_url: cachedUser.avatar_url,
                    }
                  : { id: userId, full_name: "", avatar_url: null },
                images: [],
              } as unknown as ItemWithUser;

              return [synthetic, ...old];
            });
          }, INSERT_DEBOUNCE_MS);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "items", filter: `user_id=eq.${userId}` },
        (payload) => {
          const next = payload.new as ItemChangeRow;
          if (!next.id) return;

          if (EVICT_STATUSES.has(next.status ?? "")) {
            evictProfileItem(next.id);
          } else {
            patchProfileItem(next.id, next);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "items", filter: `user_id=eq.${userId}` },
        (payload) => {
          const old = payload.old as ItemChangeRow;
          if (old.id) evictProfileItem(old.id);
        }
      )
      // ── Profile user row: recoveries_count, full_name, etc. ──────────────
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "users", filter: `id=eq.${userId}` },
        (payload) => {
          patchProfileUser(payload.new as Partial<ProfileUser>);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
      if (insertDebounceRef.current !== null) {
        clearTimeout(insertDebounceRef.current);
        insertDebounceRef.current = null;
      }
    };
  }, [userId, evictProfileItem, patchProfileItem, patchProfileUser]);
  // All deps are stable (userId is string, callbacks are useCallback) — effect
  // runs once per userId change, never on every render.

  return { refresh };
}
