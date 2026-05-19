"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { ItemFilters } from "@/types/items";

export function useItemFilters(): [
  ItemFilters,
  (filters: Partial<ItemFilters>) => void,
  () => void,
] {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters: ItemFilters = {
    type: (searchParams.get("type") as ItemFilters["type"]) ?? "all",
    search: searchParams.get("search") ?? undefined,
    location: searchParams.get("location") ?? undefined,
    status: (searchParams.get("status") as ItemFilters["status"]) ?? "active",
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
  };

  const setFilters = useCallback(
    (updates: Partial<ItemFilters>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value == null || value === "" || value === "all") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  const resetFilters = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  return [filters, setFilters, resetFilters];
}
