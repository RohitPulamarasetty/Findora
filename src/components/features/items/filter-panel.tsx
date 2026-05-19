"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ITEM_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ItemFilters } from "@/types/items";

interface FilterPanelProps {
  filters: ItemFilters;
  onChange: (filters: Partial<ItemFilters>) => void;
  onReset: () => void;
}

export function FilterPanel({ filters, onChange, onReset }: FilterPanelProps) {
  return (
    <div className="space-y-5 rounded-2xl border border-border-default bg-bg-subtle p-4 shadow-card">
      {/* ── Category filter ──────────────────────────────────────── */}
      <div>
        <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted-fg">
          Category
        </p>
        <div className="flex flex-wrap gap-1.5">
          {ITEM_CATEGORIES.map((cat) => {
            const selected = filters.category?.includes(cat as never);
            return (
              <button
                key={cat}
                onClick={() => {
                  const current = filters.category ?? [];
                  onChange({
                    category: selected
                      ? current.filter((c) => c !== cat)
                      : [...current, cat as never],
                  });
                }}
                className={cn(
                  "rounded-lg border px-2.5 py-1.5 text-[11.5px] font-semibold capitalize transition-all duration-150",
                  selected
                    ? "border-brand-500/40 bg-brand-500/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                    : "border-border-default bg-bg-base text-text-secondary hover:border-border-strong hover:text-text-base"
                )}
              >
                {cat.replace(/_/g, " ")}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Date range ──────────────────────────────────────────── */}
      <div>
        <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted-fg">
          Date range
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold text-text-muted-fg">
              From
            </label>
            <input
              type="date"
              value={filters.dateFrom ?? ""}
              onChange={(e) => onChange({ dateFrom: e.target.value || undefined })}
              className="w-full rounded-xl border border-border-default bg-bg-base px-3 py-2 text-[12px] font-medium text-text-base shadow-sm transition-colors focus:border-brand-500/50 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold text-text-muted-fg">To</label>
            <input
              type="date"
              value={filters.dateTo ?? ""}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => onChange({ dateTo: e.target.value || undefined })}
              className="w-full rounded-xl border border-border-default bg-bg-base px-3 py-2 text-[12px] font-medium text-text-base shadow-sm transition-colors focus:border-brand-500/50 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
            />
          </div>
        </div>
      </div>

      {/* ── Reset ────────────────────────────────────────────────── */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onReset}
        className="w-full gap-1.5 text-text-muted-fg"
      >
        <RotateCcw size={13} />
        Reset all filters
      </Button>
    </div>
  );
}
