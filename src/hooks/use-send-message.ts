"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import type { Message } from "@/types/conversations";

export function useSendMessage(conversationId: string, currentUserId: string) {
  const queryClient = useQueryClient();
  const msgKey = queryKeys.conversations.messages(conversationId);

  return useMutation({
    mutationFn: async (content: string): Promise<Message> => {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to send message");
      }
      return res.json();
    },

    onMutate: async (content) => {
      // Cancel any in-flight refetch so it doesn't overwrite our optimistic state.
      await queryClient.cancelQueries({ queryKey: msgKey });
      const prev = queryClient.getQueryData<Message[]>(msgKey);

      // Stable unique ID so onSuccess can find and replace this exact entry.
      const optimisticId = `opt-${Date.now()}`;

      const optimistic: Message = {
        id: optimisticId,
        conversation_id: conversationId,
        sender_id: currentUserId,
        content,
        is_system: false,
        status: "sent",
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData<Message[]>(msgKey, (old) => [...(old ?? []), optimistic]);

      return { prev, optimisticId };
    },

    onSuccess: (realMessage, _content, ctx) => {
      // Replace the optimistic placeholder with the confirmed server message.
      // The realtime listener may have already inserted the real message, so
      // we deduplicate by real ID before appending.
      queryClient.setQueryData<Message[]>(msgKey, (old = []) => {
        const withoutOptimistic = old.filter((m) => m.id !== ctx?.optimisticId);
        if (withoutOptimistic.some((m) => m.id === realMessage.id)) {
          return withoutOptimistic; // realtime already added it
        }
        return [...withoutOptimistic, realMessage];
      });
    },

    onError: (err: Error, _vars, ctx) => {
      // Roll back to the state before the optimistic update.
      if (ctx?.prev !== undefined) {
        queryClient.setQueryData(msgKey, ctx.prev);
      }
      toast.error(err.message);
    },

    onSettled: () => {
      // Refresh the conversation list so the last-message preview and unread
      // badge stay in sync. Do NOT invalidate the messages query here — the
      // onSuccess handler already put the cache in the correct state and the
      // realtime subscription handles the receiver side.
      void queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.lists(),
      });
    },
  });
}
