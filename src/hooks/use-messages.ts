"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import type { Message } from "@/types/conversations";

export function useMessages(conversationId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.conversations.messages(conversationId),
    queryFn: async (): Promise<Message[]> => {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!conversationId,
  });

  useEffect(() => {
    if (!conversationId) return;
    const supabase = createClient();

    // Merge a single incoming message into the cache without a round-trip.
    const appendMessage = (incoming: Message) => {
      queryClient.setQueryData<Message[]>(
        queryKeys.conversations.messages(conversationId),
        (old = []) => {
          if (old.some((m) => m.id === incoming.id)) return old;
          return [...old, incoming];
        }
      );
    };

    // Trigger a background refetch (existing data stays visible during fetch).
    const refetchMessages = () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.messages(conversationId),
      });
    };

    const channel = supabase
      .channel(`msgs:${conversationId}`)
      // ── Primary ──────────────────────────────────────────────────────
      // Direct INSERT event on messages — instant delivery when the table
      // is included in the Supabase realtime publication.
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => appendMessage(payload.new as Message)
      )
      // ── Secondary ─────────────────────────────────────────────────────
      // The handle_new_message trigger updates conversations.last_message_at
      // and unread counts on every INSERT into messages. This UPDATE event
      // reaches both participants (conversations table has looser RLS than
      // messages) and is a reliable cross-user delivery signal.
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `id=eq.${conversationId}`,
        },
        refetchMessages
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  // Safety-net polling — catches anything missed by realtime (websocket
  // reconnects, brief disconnections). The realtime channel above is the
  // primary delivery mechanism, so this only needs to be a slow fallback.
  //
  // Also pauses while the tab is hidden so we don't burn requests in the
  // background — visibilitychange re-triggers refetch on return.
  useEffect(() => {
    if (!conversationId) return;
    if (typeof document === "undefined") return;

    const refetch = () =>
      void queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.messages(conversationId),
      });

    let id: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (id !== null) return;
      // 60s (was 15s) — realtime is primary; this is just a heartbeat.
      id = setInterval(refetch, 60_000);
    };
    const stop = () => {
      if (id !== null) {
        clearInterval(id);
        id = null;
      }
    };

    if (document.visibilityState === "visible") start();
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        refetch(); // immediate refetch on tab return
        start();
      } else {
        stop();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [conversationId, queryClient]);

  return query;
}
