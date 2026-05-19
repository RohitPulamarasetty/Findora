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
import type { ItemCategory } from "@/types/items";

interface CategoryBadgeProps {
  category: ItemCategory;
  showLabel?: boolean;
  size?: "sm" | "md";
  className?: string;
}

const CATEGORY_CONFIG: Record<ItemCategory, { label: string; Icon: React.ElementType }> = {
  electronics: { label: "Electronics", Icon: Laptop },
  clothing: { label: "Clothing", Icon: Shirt },
  accessories: { label: "Accessories", Icon: Watch },
  books: { label: "Books", Icon: BookOpen },
  keys: { label: "Keys", Icon: Key },
  bag: { label: "Bag", Icon: Backpack },
  stationery: { label: "Stationery", Icon: PenLine },
  sports: { label: "Sports", Icon: Dumbbell },
  wallet: { label: "Wallet", Icon: Wallet },
  id_card: { label: "ID Card", Icon: CreditCard },
  other: { label: "Other", Icon: HelpCircle },
};

export function CategoryBadge({
  category,
  showLabel = true,
  size = "md",
  className,
}: CategoryBadgeProps) {
  const config = CATEGORY_CONFIG[category] ?? { label: category, Icon: HelpCircle };
  const { label, Icon } = config;
  const iconSize = size === "sm" ? 11 : 13;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-bg-muted-surface text-text-muted-fg ring-1 ring-border-default/60",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
        className
      )}
    >
      <Icon size={iconSize} aria-hidden="true" />
      {showLabel && label}
    </span>
  );
}
