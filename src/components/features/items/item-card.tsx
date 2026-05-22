"use client";

import { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Clock, Camera } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { highlightTerms } from "@/lib/highlight";
import { useNavTransition } from "@/hooks/use-nav-transition";
import { cn } from "@/lib/utils";
import type { ItemWithUser } from "@/types/items";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

interface ItemCardProps {
  item: ItemWithUser;
  variant?: "grid" | "list";
  showOwner?: boolean;
  searchQuery?: string;
  className?: string;
}

const CATEGORY_ICON: Record<string, string> = {
  electronics: "💻",
  clothing: "👕",
  accessories: "⌚",
  books: "📚",
  keys: "🔑",
  bag: "🎒",
  stationery: "✏️",
  sports: "⚽",
  wallet: "👛",
  id_card: "🪪",
  other: "📦",
};

function ItemCardImpl({
  item,
  variant = "grid",
  showOwner = false,
  searchQuery,
  className,
}: ItemCardProps) {
  const hasImage = item.images?.length > 0;
  const isLost = item.type === "lost";
  const isActive = item.status === "active";
  const emoji = CATEGORY_ICON[item.category] ?? "📦";
  const href = `/items/${item.id}`;
  const { isPending, pendingHref, linkProps } = useNavTransition();
  // Apply a subtle pending look while we're navigating *to this card*.
  // Other cards on the same screen stay fully opaque so the user can still
  // change their mind and tap a different one.
  const isOpening = isPending && pendingHref === href;

  /* ── List variant ────────────────────────────────────────────── */
  if (variant === "list") {
    return (
      <Link
        href={href}
        {...linkProps(href)}
        aria-busy={isOpening || undefined}
        className={cn(
          "group flex gap-3.5 rounded-2xl border border-border-default bg-bg-subtle p-3.5 transition-all duration-200",
          "hover:border-brand-500/20 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]",
          "dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.35)]",
          isOpening && "pointer-events-none opacity-70",
          className
        )}
      >
        <div className="relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-xl bg-bg-muted-surface">
          {hasImage ? (
            <Image
              src={item.images[0].url}
              alt={item.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="68px"
            />
          ) : (
            <div
              className={cn(
                "flex h-full items-center justify-center text-2xl",
                isLost ? "bg-red-500/6" : "bg-emerald-500/6"
              )}
            >
              {emoji}
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-1">
          <div>
            <div className="mb-1 flex items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                  isLost
                    ? "bg-red-500/10 text-red-500 dark:text-red-400"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                )}
              >
                {isLost ? "Lost" : "Found"}
              </span>
              {!isActive && <StatusBadge status={item.status} size="sm" />}
            </div>
            <h3 className="line-clamp-1 text-[13.5px] font-bold text-text-base">
              {searchQuery ? highlightTerms(item.title, searchQuery) : item.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-text-muted-fg">
            {item.location && (
              <span className="flex min-w-0 items-center gap-0.5 truncate">
                <MapPin size={10} className="shrink-0" />
                <span className="truncate">
                  {searchQuery ? highlightTerms(item.location, searchQuery) : item.location}
                </span>
              </span>
            )}
            <span className="ml-auto flex shrink-0 items-center gap-0.5">
              <Clock size={10} />
              {timeAgo(item.created_at)}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  /* ── Grid variant (default) ──────────────────────────────────── */
  return (
    <Link
      href={href}
      {...linkProps(href)}
      aria-busy={isOpening || undefined}
      className={cn(
        "group block overflow-hidden rounded-2xl border border-border-default bg-bg-subtle",
        "shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]",
        "dark:shadow-[0_2px_8px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.2)]",
        "ease-[cubic-bezier(0.16,1,0.3,1)] transition-all duration-300",
        "hover:-translate-y-1.5 hover:border-brand-500/25",
        "hover:shadow-[0_12px_28px_rgba(0,0,0,0.11),0_4px_10px_rgba(0,0,0,0.07)]",
        "dark:hover:shadow-[0_12px_32px_rgba(0,0,0,0.55),0_4px_10px_rgba(0,0,0,0.35)]",
        isOpening && "pointer-events-none opacity-70",
        className
      )}
    >
      {/* ── Image area ──────────────────────────────────────────── */}
      <div className="relative aspect-[4/3] overflow-hidden bg-bg-muted-surface">
        {hasImage ? (
          <>
            <Image
              src={item.images[0].url}
              alt={item.title}
              fill
              className="object-cover transition-transform duration-500 will-change-transform group-hover:scale-[1.06]"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
            {item.images.length > 1 && (
              <div className="absolute bottom-2 right-2 flex items-center gap-0.5 rounded-lg bg-black/55 px-2 py-0.5 text-[9px] font-semibold text-white backdrop-blur-sm">
                <Camera size={8} />
                {item.images.length}
              </div>
            )}
          </>
        ) : (
          <div
            className={cn(
              "flex h-full flex-col items-center justify-center gap-2",
              isLost
                ? "bg-gradient-to-br from-red-500/10 to-red-500/5"
                : "bg-gradient-to-br from-emerald-500/10 to-emerald-500/5"
            )}
          >
            <span className="text-3xl">{emoji}</span>
            <span className="text-[10px] capitalize tracking-wide text-text-muted-fg">
              {item.category.replace(/_/g, " ")}
            </span>
          </div>
        )}

        {/* Type pill — top left */}
        <div className="absolute left-2.5 top-2.5">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide backdrop-blur-sm",
              isLost
                ? "bg-red-500/30 text-white ring-1 ring-red-400/30"
                : "bg-emerald-500/30 text-white ring-1 ring-emerald-400/30"
            )}
          >
            {isLost ? "Lost" : "Found"}
          </span>
        </div>

        {/* Status badge — top right (non-active only) */}
        {!isActive && (
          <div className="absolute right-2.5 top-2.5">
            <StatusBadge status={item.status} size="sm" />
          </div>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="p-3.5">
        <h3 className="mb-2 line-clamp-2 text-[13.5px] font-bold leading-snug text-text-base">
          {searchQuery ? highlightTerms(item.title, searchQuery) : item.title}
        </h3>
        <div className="flex items-center justify-between gap-2 text-[11px] text-text-muted-fg">
          {item.location ? (
            <span className="flex min-w-0 items-center gap-0.5">
              <MapPin size={9} className="shrink-0" />
              <span className="truncate">
                {searchQuery ? highlightTerms(item.location, searchQuery) : item.location}
              </span>
            </span>
          ) : (
            <span className="capitalize">{item.category.replace(/_/g, " ")}</span>
          )}
          <span className="shrink-0 tabular-nums">{timeAgo(item.created_at)}</span>
        </div>

        {showOwner && item.user && (
          <div className="mt-2.5 flex items-center gap-1.5 border-t border-border-default pt-2.5">
            {item.user.avatar_url ? (
              <Image
                src={item.user.avatar_url}
                alt={item.user.full_name}
                width={16}
                height={16}
                className="rounded-full ring-1 ring-border-default"
              />
            ) : (
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-500/10 text-[8px] font-bold text-brand-600 dark:text-brand-400">
                {item.user.full_name[0]}
              </div>
            )}
            <span className="truncate text-[11px] font-medium text-text-secondary">
              {item.user.full_name}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

// Memoized — the item grid is the busiest list in the app and refetches on
// scroll/pagination/filters. Without memo, every appended page re-renders
// every previously-visible card (incl. all the Next/Image children).
// We compare the small set of fields actually rendered.
export const ItemCard = memo(ItemCardImpl, (prev, next) => {
  if (prev.variant !== next.variant) return false;
  if (prev.showOwner !== next.showOwner) return false;
  if (prev.searchQuery !== next.searchQuery) return false;
  if (prev.className !== next.className) return false;
  const a = prev.item;
  const b = next.item;
  return (
    a.id === b.id &&
    a.title === b.title &&
    a.status === b.status &&
    a.type === b.type &&
    a.category === b.category &&
    a.location === b.location &&
    a.created_at === b.created_at &&
    (a.images?.length ?? 0) === (b.images?.length ?? 0) &&
    a.images?.[0]?.url === b.images?.[0]?.url &&
    a.user?.full_name === b.user?.full_name &&
    a.user?.avatar_url === b.user?.avatar_url
  );
});
