"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import type { Item } from "@/types/items";

interface CreateItemPayload {
  type: "lost" | "found";
  category: string;
  title: string;
  description: string;
  location: string;
  date_occurred: string;
  verification_questions?: string[];
}

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateItemPayload): Promise<Item> => {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to create item");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
      toast.success("Item reported successfully.");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
