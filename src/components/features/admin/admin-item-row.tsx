"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { ItemStatus } from "@/types/database";

interface AdminItemRowProps {
  item: {
    id: string;
    title: string;
    type: string;
    status: ItemStatus;
    category: string;
    created_at: string;
    user?: { full_name: string } | null;
  };
  onDelete: () => void;
}

export function AdminItemRow({ item, onDelete }: AdminItemRowProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleDelete() {
    setIsPending(true);
    const res = await fetch(`/api/admin/items/${item.id}`, { method: "DELETE" });
    setIsPending(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Failed to delete item");
    } else {
      toast.success("Item deleted");
      setDeleteOpen(false);
      onDelete();
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 rounded-xl border border-border-default bg-bg-base p-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-text-base">{item.title}</span>
            <span
              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize ${
                item.type === "lost"
                  ? "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                  : "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
              }`}
            >
              {item.type}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <StatusBadge status={item.status} />
            {item.user && (
              <span className="text-xs text-text-muted-fg">by {item.user.full_name}</span>
            )}
            <span className="text-xs text-text-muted-fg">
              {new Date(item.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/items/${item.id}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted-fg hover:bg-bg-subtle hover:text-text-base"
            target="_blank"
          >
            <ExternalLink size={14} />
          </Link>
          <Button
            size="sm"
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/20"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this item?"
        description={`"${item.title}" and all its images will be permanently deleted.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isPending}
        onConfirm={() => void handleDelete()}
      />
    </>
  );
}
