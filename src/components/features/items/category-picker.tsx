"use client";

import {
  Laptop,
  Shirt,
  Watch,
  BookOpen,
  PenLine,
  Key,
  Wallet,
  CreditCard,
  Backpack,
  Dumbbell,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ITEM_CATEGORIES } from "@/lib/constants";

const ICONS: Record<string, React.ElementType> = {
  electronics: Laptop,
  clothing: Shirt,
  accessories: Watch,
  books: BookOpen,
  keys: Key,
  bag: Backpack,
  stationery: PenLine,
  sports: Dumbbell,
  other: HelpCircle,
  wallet: Wallet,
  id_card: CreditCard,
};

const LABELS: Record<string, string> = {
  electronics: "Electronics",
  clothing: "Clothing",
  accessories: "Accessories",
  books: "Books",
  keys: "Keys",
  bag: "Bag",
  stationery: "Stationery",
  sports: "Sports",
  other: "Other",
  wallet: "Wallet",
  id_card: "ID Card",
};

interface CategoryPickerProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function CategoryPicker({ value, onChange, error }: CategoryPickerProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5 md:grid-cols-6">
        {ITEM_CATEGORIES.map((cat) => {
          const Icon = ICONS[cat] ?? HelpCircle;
          const label = LABELS[cat] ?? cat;
          const selected = value === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onChange(cat)}
              aria-pressed={selected}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border px-1.5 py-2.5 text-center transition-all duration-150",
                selected
                  ? "dark:text-brand-300 border-brand-500/60 bg-brand-50 text-brand-600 shadow-sm dark:border-brand-400/50 dark:bg-brand-900/25"
                  : "hover:border-brand-300/50 border-border-default bg-bg-subtle text-text-muted-fg hover:bg-bg-muted-surface hover:text-text-secondary"
              )}
            >
              <Icon
                size={17}
                aria-hidden="true"
                className={selected ? "text-brand-500 dark:text-brand-400" : ""}
              />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
