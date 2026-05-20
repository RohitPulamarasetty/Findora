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
    // Realtime channel (useRealtimeConversations) is the primary update path.
    // The polling here is a slow safety-net for missed events / reconnects.
    // Stretched from 30s → 90s; gated on tab visibility to avoid background
    // requests when the user has the tab in the background.
    refetchInterval: (q) => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return false;
      }
      return q.state.error ? false : 90_000;
    },
    refetchIntervalInBackground: false,
    staleTime: 30_000,
  });
}
