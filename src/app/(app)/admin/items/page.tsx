"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminItemRow } from "@/components/features/admin/admin-item-row";
import { useDebounce } from "@/hooks/use-debounce";
import type { ItemStatus } from "@/types/database";

interface AdminItem {
  id: string;
  title: string;
  type: string;
  status: ItemStatus;
  category: string;
  created_at: string;
  user_id: string;
}

interface ItemsResponse {
  items: AdminItem[];
  total: number;
  nextCursor: string | null;
}

export default function AdminItemsPage() {
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState<string | undefined>();
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, refetch } = useQuery<ItemsResponse>({
    queryKey: ["admin", "items", debouncedSearch, cursor],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "20" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (cursor) params.set("cursor", cursor);
      const res = await fetch(`/api/items?${params}`);
      if (!res.ok) throw new Error("Failed to fetch items");
      return res.json();
    },
  });

  return (
    <main className="page-safe-bottom px-4 py-6">
      <h1 className="mb-4 text-lg font-bold text-text-base">Item Management</h1>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-fg" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCursor(undefined);
          }}
          placeholder="Search items…"
          className="w-full rounded-xl border border-border-default bg-bg-subtle py-2.5 pl-9 pr-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-bg-subtle" />
          ))}
        </div>
      ) : (
        <>
          <p className="mb-3 text-xs text-text-muted-fg">
            {data?.items?.length ?? 0}
            {data?.nextCursor ? "+" : ""} item{data?.items?.length !== 1 ? "s" : ""}
          </p>
          <div className="space-y-2">
            {(data?.items ?? []).map((item) => (
              <AdminItemRow key={item.id} item={item} onDelete={() => void refetch()} />
            ))}
          </div>
          {data?.nextCursor && (
            <button
              onClick={() => setCursor(data.nextCursor ?? undefined)}
              className="mt-4 w-full rounded-xl border border-border-default py-2 text-sm text-text-secondary hover:bg-bg-subtle"
            >
              Load more
            </button>
          )}
        </>
      )}
    </main>
  );
}
