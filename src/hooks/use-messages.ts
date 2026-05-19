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

  // Safety-net polling — catches anything missed by realtime (e.g. websocket
  // reconnects, brief disconnections). Background refetch keeps UI stable.
  useEffect(() => {
    if (!conversationId) return;
    const id = setInterval(
      () =>
        void queryClient.invalidateQueries({
          queryKey: queryKeys.conversations.messages(conversationId),
        }),
      15_000
    );
    return () => clearInterval(id);
  }, [conversationId, queryClient]);

  return query;
}
