"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { ConversationWithPreview } from "@/types/conversations";

export function useConversations() {
  return useQuery({
    queryKey: queryKeys.conversations.lists(),
    queryFn: async (): Promise<ConversationWithPreview[]> => {
      const res = await fetch("/api/conversations");
      if (!res.ok) throw new Error("Failed to fetch conversations");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 30_000,
  });
}
