"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import type { ItemWithUser } from "@/types/items";
import type { UpdateItemInput } from "@/lib/validations";

export function useUpdateItem(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateItemInput): Promise<ItemWithUser> => {
      const res = await fetch(`/api/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to update item");
      }
      return res.json();
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.items.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.items.lists() });
      toast.success("Item updated.");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
