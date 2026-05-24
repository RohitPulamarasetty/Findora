"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import type { Database } from "@/types/database";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

// Columns the client actually reads. Keep in sync with consumers; expanding
// here is the only place to add fields.
const CLIENT_USER_FIELDS =
  "id, email, full_name, avatar_url, role, is_banned, created_at, updated_at";

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.users.current(),
    queryFn: async (): Promise<UserRow | null> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      // PERF: was `.select("*")`; pruned to the columns the UI actually
      // reads. Saves payload + serialization on every authenticated mount.
      const { data, error } = await supabase
        .from("users")
        .select(CLIENT_USER_FIELDS)
        .eq("id", user.id)
        .maybeSingle<UserRow>();

      if (error) {
        console.error("[useCurrentUser] profile fetch error", {
          userId: user.id,
          code: error.code,
          message: error.message,
        });
      }

      if (!data) {
        console.warn("[useCurrentUser] no profile row found for authenticated user", {
          userId: user.id,
        });
      }

      return data;
    },
    staleTime: 5 * 60 * 1000,
    // Profile rarely changes during a session — keep cached longer to avoid
    // refetches when navigating between pages that read currentUser.
    gcTime: 30 * 60 * 1000,
  });
}
