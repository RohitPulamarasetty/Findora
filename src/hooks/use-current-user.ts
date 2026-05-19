"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import type { Database } from "@/types/database";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.users.current(),
    queryFn: async (): Promise<UserRow | null> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase.from("users").select("*").eq("id", user.id).single();

      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
