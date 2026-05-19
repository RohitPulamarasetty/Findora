"use client";

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

export function ItemGrid({
  items,
  isLoading,
  columns = 2,
  showOwner,
  searchQuery,
  className,
}: ItemGridProps) {
  const reduced = useReducedMotion();

  if (isLoading) return <ItemCardSkeletonGrid count={6} />;

  return (
    <motion.div
      variants={reduced ? undefined : staggerFast}
      initial={reduced ? false : "hidden"}
      animate={reduced ? false : "visible"}
      className={cn("grid gap-3", COLUMN_CLASSES[columns], className)}
    >
      {items.map((item) => (
        <motion.div key={item.id} variants={reduced ? undefined : cardVariant}>
          <ItemCard item={item} showOwner={showOwner} searchQuery={searchQuery} />
        </motion.div>
      ))}
    </motion.div>
  );
}
