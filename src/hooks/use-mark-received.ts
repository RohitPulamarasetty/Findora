"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import type { ItemWithUser } from "@/types/items";

export function useMarkReceived(itemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<ItemWithUser> => {
      const res = await fetch(`/api/items/${itemId}/complete`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to mark as received");
      }
      return res.json();
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.items.detail(itemId) });
      const prev = queryClient.getQueryData<ItemWithUser>(queryKeys.items.detail(itemId));
      if (prev) {
        queryClient.setQueryData(queryKeys.items.detail(itemId), {
          ...prev,
          status: "completed",
        });
      }
      return { prev };
    },
    onError: (err: Error, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(queryKeys.items.detail(itemId), ctx.prev);
      }
      toast.error(err.message);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.items.detail(itemId), updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.items.lists() });
      toast.success("Item marked as recovered! The case is now closed.");
    },
  });
}
