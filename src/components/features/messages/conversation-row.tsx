"use client";

import { memo } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useNavTransition } from "@/hooks/use-nav-transition";
import { cn } from "@/lib/utils";
import type { ConversationWithPreview } from "@/types/conversations";

interface ConversationRowProps {
  conversation: ConversationWithPreview;
}

function ConversationRowImpl({ conversation }: ConversationRowProps) {
  const { id, other_user, item, last_message, unread_count, is_locked } = conversation;
  const href = `/messages/${id}`;
  const { isPending, pendingHref, linkProps } = useNavTransition();
  const isOpening = isPending && pendingHref === href;

  function timeAgoLabel(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }

  const timeAgo = last_message ? timeAgoLabel(last_message.created_at) : null;
  const hasUnread = unread_count > 0;

  return (
    <motion.div
      whileTap={{ scale: 0.985, transition: { duration: 0.1 } }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={href}
        {...linkProps(href)}
        aria-busy={isOpening || undefined}
        className={cn(
          "flex items-center gap-3.5 rounded-2xl px-4 py-3.5 transition-all duration-150",
          hasUnread
            ? "hover:bg-brand-500/8 dark:bg-brand-500/6 bg-brand-500/5 ring-1 ring-brand-500/15 dark:ring-brand-500/20"
            : "bg-bg-subtle ring-1 ring-border-default/60 hover:bg-bg-muted-surface hover:ring-border-strong",
          isOpening && "pointer-events-none opacity-70"
        )}
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          <UserAvatar user={other_user ?? { full_name: "Unknown", avatar_url: null }} size="md" />
          {hasUnread && (
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-500 px-1 text-[9px] font-bold leading-none text-white ring-2 ring-bg-base dark:ring-bg-muted-surface">
              {unread_count > 99 ? "99+" : unread_count}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Name + time */}
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "truncate text-[13.5px]",
                hasUnread ? "font-bold text-text-base" : "font-semibold text-text-base"
              )}
            >
              {other_user?.full_name ?? "Unknown User"}
            </span>
            <div className="flex shrink-0 items-center gap-1.5">
              {is_locked && <Lock size={10} className="text-text-muted-fg" />}
              {timeAgo && (
                <span
                  className={cn(
                    "text-[11px] tabular-nums",
                    hasUnread
                      ? "font-semibold text-brand-500 dark:text-brand-400"
                      : "text-text-muted-fg"
                  )}
                >
                  {timeAgo}
                </span>
              )}
            </div>
          </div>

          {/* Item reference */}
          {item && (
            <p className="truncate text-[11px] font-semibold leading-tight text-brand-500 dark:text-brand-400">
              {item.title}
            </p>
          )}

          {/* Last message preview */}
          <p
            className={cn(
              "mt-0.5 truncate text-[12.5px] leading-tight",
              hasUnread ? "font-medium text-text-secondary" : "text-text-muted-fg"
            )}
          >
            {last_message ? last_message.content : <span className="italic">No messages yet</span>}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

// Memoized — conversation list refetches on realtime events and polling.
// Without memo, all rows re-render on any sibling row's change.
// Equality covers the fields the row actually displays.
export const ConversationRow = memo(ConversationRowImpl, (prev, next) => {
  const a = prev.conversation;
  const b = next.conversation;
  return (
    a.id === b.id &&
    a.unread_count === b.unread_count &&
    a.is_locked === b.is_locked &&
    a.last_message?.content === b.last_message?.content &&
    a.last_message?.created_at === b.last_message?.created_at &&
    a.other_user?.full_name === b.other_user?.full_name &&
    a.other_user?.avatar_url === b.other_user?.avatar_url &&
    a.item?.title === b.item?.title
  );
});
