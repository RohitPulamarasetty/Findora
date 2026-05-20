"use client";

import { useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { ItemFilters, ItemWithUser } from "@/types/items";

const PAGE_SIZE = 20;

interface ItemsPage {
  items: ItemWithUser[];
  nextCursor: string | null;
}

export function useItems(filters: ItemFilters = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.items.list(filters as Record<string, unknown>),
    queryFn: async ({ pageParam }): Promise<ItemsPage> => {
      const params = new URLSearchParams();
      if (filters.type && filters.type !== "all") params.set("type", filters.type);
      if (filters.search) params.set("search", filters.search);
      if (filters.category?.length) params.set("category", filters.category.join(","));
      if (filters.location) params.set("location", filters.location);
      if (filters.status && filters.status !== "all") params.set("status", filters.status);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      if (pageParam) params.set("cursor", pageParam);
      params.set("limit", String(PAGE_SIZE));

      const res = await fetch(`/api/items?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch items");
      return res.json() as Promise<ItemsPage>;
    },
    initialPageParam: "" as string,
    getNextPageParam: (last): string | undefined => last.nextCursor ?? undefined,
    select: (data) => ({
      ...data,
      items: data.pages.flatMap((p) => p.items),
    }),
    // PERF: keep the previously-rendered list visible while a new filter /
    // search query loads. Avoids the jarring "skeleton flash" every time
    // the user changes a tab or types in the search bar.
    placeholderData: keepPreviousData,
  });
}
