"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useAppStore } from "@/stores/app-store";
import { queryKeys } from "@/lib/query-keys";
import type { ConversationWithPreview } from "@/types/conversations";

export function useRealtimeConversations(userId: string | undefined) {
  const queryClient = useQueryClient();
  const setUnreadMessages = useAppStore((s) => s.setUnreadMessages);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`user-conversations:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `owner_id=eq.${userId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.conversations.lists() });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `finder_id=eq.${userId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.conversations.lists() });
        }
      )
      .subscribe();

    const updateUnread = () => {
      const convos = queryClient.getQueryData<ConversationWithPreview[]>(
        queryKeys.conversations.lists()
      );
      if (!convos) return;
      const total = convos.reduce((sum, c) => sum + (c.unread_count ?? 0), 0);
      setUnreadMessages(total);
    };

    const unsubscribe = queryClient.getQueryCache().subscribe(({ type }) => {
      if (type === "updated") updateUnread();
    });

    return () => {
      void supabase.removeChannel(channel);
      unsubscribe();
    };
  }, [userId, queryClient, setUnreadMessages]);
}
