"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminUserRow } from "@/components/features/admin/admin-user-row";
import { useDebounce } from "@/hooks/use-debounce";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { Database } from "@/types/database";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

interface UsersResponse {
  users: UserRow[];
  total: number;
  page: number;
  limit: number;
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);
  const { data: currentUser } = useCurrentUser();

  const { data, isLoading, refetch } = useQuery<UsersResponse>({
    queryKey: ["admin", "users", debouncedSearch, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page) });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  return (
    <main className="page-safe-bottom px-4 py-6">
      <h1 className="mb-4 text-lg font-bold text-text-base">User Management</h1>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-fg" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name or email…"
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
            {data?.total ?? 0} user{data?.total !== 1 ? "s" : ""}
          </p>
          <div className="space-y-2">
            {data?.users.map((user) => (
              <AdminUserRow
                key={user.id}
                user={user}
                currentAdminId={currentUser?.id ?? ""}
                onUpdate={() => void refetch()}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-border-default px-3 py-1.5 text-xs disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-text-muted-fg">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-border-default px-3 py-1.5 text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
