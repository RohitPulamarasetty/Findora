"use client";

import { memo, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ItemCard } from "./item-card";
import { ItemCardSkeletonGrid } from "@/components/shared/loading-skeletons/item-card-skeleton";
import { staggerFast, cardVariant } from "@/lib/animations";
import type { ItemWithUser } from "@/types/items";

interface ItemGridProps {
  items: ItemWithUser[];
  isLoading?: boolean;
  columns?: 1 | 2 | 3;
  showOwner?: boolean;
  searchQuery?: string;
  className?: string;
}

const COLUMN_CLASSES = {
  1: "grid-cols-1",
  2: "grid-cols-2 sm:grid-cols-3",
  3: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
} as const;

function ItemGridImpl({
  items,
  isLoading,
  columns = 2,
  showOwner,
  searchQuery,
  className,
}: ItemGridProps) {
  const reduced = useReducedMotion();

  // Stagger animation only fires for the first page's entrance. Subsequent
  // pages appended via infinite scroll skip the stagger so the user doesn't
  // see late-arriving cards fade in awkwardly after a scroll, AND we avoid
  // re-running the variants tree on every refetch.
  const animateInitial = useMemo(() => !reduced, [reduced]);

  if (isLoading) return <ItemCardSkeletonGrid count={6} />;

  return (
    <motion.div
      variants={animateInitial ? staggerFast : undefined}
      initial={animateInitial ? "hidden" : false}
      animate={animateInitial ? "visible" : false}
      className={cn("grid gap-3", COLUMN_CLASSES[columns], className)}
    >
      {items.map((item) => (
        <motion.div key={item.id} variants={animateInitial ? cardVariant : undefined}>
          <ItemCard item={item} showOwner={showOwner} searchQuery={searchQuery} />
        </motion.div>
      ))}
    </motion.div>
  );
}

// Memo so a parent rerender (e.g. filter UI state change) doesn't rebuild
// the whole grid when the items array reference is the same.
export const ItemGrid = memo(ItemGridImpl);
