"use client";

/**
 * useRealtimeConversation — scoped subscription to a single conversation
 * row. Used by the conversation view to react instantly when the parent
 * item is marked recovered (which flips `conversations.is_locked = true`).
 *
 * NB: `useMessages` already subscribes to the same conversation row for a
 * different reason — it watches UPDATEs to drive a messages refetch when
 * the conversation's last_message_at bumps. These two subscribers share a
 * channel name (one channel per conversation_id), which Supabase realtime
 * supports — each `.on()` is delivered independently. To keep them
 * isolated and avoid any accidental cross-talk we use a distinct channel
 * name here (`convo-meta:`) so each hook owns its own channel lifecycle.
 *
 * Callback stored in a ref so the channel doesn't tear down on every
 * parent render.
 */
import { useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";

interface ConversationMetaRow {
  is_locked?: boolean;
}

interface UseRealtimeConversationOptions {
  onUpdate?: (next: ConversationMetaRow) => void;
}

export function useRealtimeConversation(
  conversationId: string | undefined,
  options: UseRealtimeConversationOptions
) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!conversationId) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`convo-meta:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `id=eq.${conversationId}`,
        },
        (payload) => {
          optionsRef.current.onUpdate?.(payload.new as ConversationMetaRow);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId]);
}
