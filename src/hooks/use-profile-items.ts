"use client";

/**
 * useProfileItems — TanStack Query wrapper for the current user's own items.
 *
 * Seeded with SSR-fetched `initialData` so the page renders instantly with no
 * loading flash. `initialDataUpdatedAt: Date.now()` prevents an immediate
 * background refetch — realtime (useRealtimeProfile) keeps the cache fresh.
 */
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import type { ItemWithUser } from "@/types/items";

// FK-pinned select to avoid PostgREST ambiguity (two FKs to users on `items`).
const PROFILE_ITEMS_SELECT = `*, user:users!items_user_id_fkey(id, full_name, avatar_url), images:item_images(id, url, storage_path, created_at)`;

export function useProfileItems(userId: string, initialData?: ItemWithUser[]) {
  return useQuery({
    queryKey: queryKeys.profile.items(userId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("items")
        .select(PROFILE_ITEMS_SELECT)
        .eq("user_id", userId)
        // Exclude soft-deleted items; all other statuses (including completed)
        // are intentionally kept so the profile shows recovery history.
        .neq("status", "removed")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ItemWithUser[];
    },
    initialData,
    // Treat SSR-fetched initial data as fresh — avoids a redundant mount
    // refetch since realtime handles subsequent updates.
    initialDataUpdatedAt: initialData ? Date.now() : undefined,
    staleTime: 30_000,
  });
}
