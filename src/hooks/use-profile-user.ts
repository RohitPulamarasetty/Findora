"use client";

/**
 * useProfileUser — TanStack Query wrapper for the current user's profile row.
 *
 * Seeded with SSR `initialData` for zero-flash hydration. Realtime updates
 * to recoveries_count / full_name / avatar_url flow in via useRealtimeProfile
 * without triggering a full refetch.
 */
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { queryKeys } from "@/lib/query-keys";

export interface ProfileUser {
  id: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
  role: string | null;
  is_banned: boolean | null;
  recoveries_count: number | null;
  created_at: string;
  updated_at: string | null;
}

export function useProfileUser(userId: string, initialData?: ProfileUser) {
  return useQuery({
    queryKey: queryKeys.profile.user(userId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("users")
        .select(
          "id, full_name, email, avatar_url, role, is_banned, recoveries_count, created_at, updated_at"
        )
        .eq("id", userId)
        .single();
      if (error) throw error;
      return data as ProfileUser;
    },
    initialData,
    initialDataUpdatedAt: initialData ? Date.now() : undefined,
    staleTime: 30_000,
  });
}
