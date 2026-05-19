"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  Flag,
  Edit,
  Trash2,
  MessageCircle,
  CheckCircle,
  ArrowRight,
  Clock,
  User,
} from "lucide-react";
import { ImageGallery } from "./image-gallery";
import { StatusBadge } from "@/components/shared/status-badge";
import { CategoryBadge } from "@/components/shared/category-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FlagDialog } from "./flag-dialog";
import { Button } from "@/components/ui/button";
import { useDeleteItem } from "@/hooks/use-delete-item";
import { useMarkReceived } from "@/hooks/use-mark-received";
import { cn } from "@/lib/utils";
import type { ItemWithUser } from "@/types/items";
import type { Database } from "@/types/database";

type CurrentUser = Database["public"]["Tables"]["users"]["Row"] | null;

interface ItemDetailProps {
  item: ItemWithUser;
  currentUser: CurrentUser;
  existingConversationId?: string | null;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(dateStr);
}

export function ItemDetail({ item, currentUser, existingConversationId }: ItemDetailProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [markReceivedOpen, setMarkReceivedOpen] = useState(false);
  const [flagOpen, setFlagOpen] = useState(false);

  const { mutate: deleteItem, isPending: isDeleting } = useDeleteItem();
  const { mutate: markReceived, isPending: isMarkingReceived } = useMarkReceived(item.id);

  const isOwner = currentUser?.id === item.user_id;
  const isAdmin = currentUser?.role === "admin";
  const isActive = item.status === "active";
  const isCompleted = item.status === "completed" || item.status === "closed";
  const canMarkReceived = isOwner && !isCompleted;
  const isLost = item.type === "lost";
  const resolveLabel = isLost ? "Mark as Recovered" : "Mark as Handed Over";

  return (
    <div className="mx-auto max-w-2xl animate-fade-in space-y-5">
      {/* ── Image gallery ────────────────────────────────────────── */}
      {item.images && item.images.length > 0 && (
        <div className="overflow-hidden rounded-2xl shadow-card ring-1 ring-border-default">
          <ImageGallery images={item.images} alt={item.title} />
        </div>
      )}

      {/* ── Header card: type + status + title ───────────────────── */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.06em]",
              isLost
                ? "bg-red-500/10 text-red-600 ring-1 ring-red-500/25 dark:text-red-400"
                : "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/25 dark:text-emerald-400"
            )}
          >
            {isLost ? "Lost" : "Found"}
          </span>
          <StatusBadge status={item.status} />
          <CategoryBadge category={item.category as never} />
        </div>
        <h1 className="text-[24px] font-bold leading-[1.18] tracking-[-0.025em] text-text-base sm:text-[28px]">
          {item.title}
        </h1>
      </div>

      {/* ── Meta grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {item.location && <MetaCard icon={MapPin} label="Location" value={item.location} accent />}
        <MetaCard
          icon={Calendar}
          label={`Date ${isLost ? "lost" : "found"}`}
          value={formatDate(item.date_occurred)}
          accent
        />
        <MetaCard icon={Clock} label="Posted" value={timeAgo(item.created_at)} />
      </div>

      {/* ── Description ──────────────────────────────────────────── */}
      {item.description && (
        <div className="rounded-2xl border border-border-default bg-bg-subtle p-4 shadow-card sm:p-5">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted-fg">
            Description
          </p>
          <p className="text-[14px] leading-relaxed text-text-secondary">{item.description}</p>
        </div>
      )}

      {/* ── Reporter card ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between rounded-2xl border border-border-default bg-bg-subtle px-4 py-3 shadow-card">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-bg-muted-surface">
            <User size={13} className="text-text-muted-fg" />
          </div>
          <span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-muted-fg">
            Reported by
          </span>
        </div>
        <div className="flex items-center gap-2">
          <UserAvatar user={item.user} size="sm" showName />
          <span className="hidden text-[11px] text-text-muted-fg sm:block">
            {formatDate(item.created_at)}
          </span>
        </div>
      </div>

      {/* ── Recovered banner ──────────────────────────────────────── */}
      {isCompleted && (
        <div className="dark:from-emerald-500/12 dark:via-emerald-400/6 flex items-start gap-3 overflow-hidden rounded-2xl border border-emerald-300/40 bg-gradient-to-br from-emerald-500/10 via-emerald-400/5 to-teal-500/10 p-4 dark:border-emerald-700/30 dark:to-teal-500/10">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 ring-1 ring-emerald-500/25">
            <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-emerald-700 dark:text-emerald-400">
              Case resolved
            </p>
            <p className="text-[12px] text-emerald-600/80 dark:text-emerald-500/80">
              This item has been successfully recovered.
            </p>
          </div>
        </div>
      )}

      {/* ── Actions ───────────────────────────────────────────────── */}
      {currentUser && (
        <div className="space-y-2.5">
          {/* Connect CTA */}
          {!isOwner && isActive && (
            <Button
              asChild
              size="lg"
              className="shadow-glow-brand group h-12 w-full gap-2 rounded-2xl"
            >
              {existingConversationId ? (
                <Link href={`/messages/${existingConversationId}`}>
                  <MessageCircle size={16} />
                  View Conversation
                  <ArrowRight
                    size={13}
                    className="ml-auto transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              ) : (
                <Link href={`/messages/new?itemId=${item.id}&ownerId=${item.user_id}`}>
                  <MessageCircle size={16} />
                  {item.type === "found" ? "Connect with Finder" : "I found this — connect"}
                  <ArrowRight
                    size={13}
                    className="ml-auto transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              )}
            </Button>
          )}

          {/* Mark recovered */}
          {canMarkReceived && (
            <Button
              size="lg"
              className="h-12 w-full gap-2 rounded-2xl border-0 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-400"
              onClick={() => setMarkReceivedOpen(true)}
            >
              <CheckCircle size={16} />
              {resolveLabel}
            </Button>
          )}

          {/* Edit */}
          {isOwner && !isCompleted && (
            <Button
              asChild
              size="default"
              variant="outline"
              className="h-11 w-full gap-2 rounded-2xl"
            >
              <Link href={`/items/${item.id}/edit`}>
                <Edit size={14} />
                Edit Report
              </Link>
            </Button>
          )}

          {/* Delete */}
          {(isOwner || isAdmin) && (
            <Button
              size="default"
              variant="outline"
              className="h-11 w-full gap-2 rounded-2xl border-red-300/50 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/20"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 size={14} />
              Delete Report
            </Button>
          )}

          {/* Flag */}
          {!isOwner && (
            <button
              onClick={() => setFlagOpen(true)}
              className="flex w-full items-center justify-center gap-1.5 py-2.5 text-[12px] font-medium text-text-muted-fg transition-colors hover:text-red-500"
            >
              <Flag size={11} />
              Report this item as inappropriate
            </button>
          )}
        </div>
      )}

      {/* ── Dialogs ───────────────────────────────────────────────── */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete report?"
        description="This will permanently remove the item and all associated images. This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={() => deleteItem(item.id)}
      />
      <FlagDialog open={flagOpen} onOpenChange={setFlagOpen} itemId={item.id} />
      <ConfirmDialog
        open={markReceivedOpen}
        onOpenChange={setMarkReceivedOpen}
        title={isLost ? "Mark item as recovered?" : "Mark as handed over?"}
        description={
          isLost
            ? "Confirm that you've got your item back. This closes the case and locks all conversations."
            : "Confirm that you've returned the item to its owner. This closes the case and locks all conversations."
        }
        confirmLabel={resolveLabel}
        isLoading={isMarkingReceived}
        onConfirm={() => {
          markReceived();
          setMarkReceivedOpen(false);
        }}
      />
    </div>
  );
}

function MetaCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl border border-border-default bg-bg-subtle px-3 py-3 shadow-card">
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
          accent ? "bg-brand-500/10 dark:bg-brand-500/15" : "bg-bg-muted-surface"
        )}
      >
        <Icon
          size={14}
          className={cn(accent ? "text-brand-500 dark:text-brand-400" : "text-text-muted-fg")}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-text-muted-fg">
          {label}
        </p>
        <p className="mt-0.5 truncate text-[13px] font-semibold text-text-base">{value}</p>
      </div>
    </div>
  );
}
