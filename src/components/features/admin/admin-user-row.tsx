"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Ban, UserCheck, Shield } from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { Database } from "@/types/database";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

interface AdminUserRowProps {
  user: UserRow;
  currentAdminId: string;
  onUpdate: () => void;
}

export function AdminUserRow({ user, currentAdminId, onUpdate }: AdminUserRowProps) {
  const [banOpen, setBanOpen] = useState(false);
  const [unbanOpen, setUnbanOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const isCurrentUser = user.id === currentAdminId;

  async function ban() {
    setIsPending(true);
    const res = await fetch(`/api/admin/users/${user.id}/ban`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Banned by admin" }),
    });
    setIsPending(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Failed to ban user");
    } else {
      toast.success("User banned");
      setBanOpen(false);
      onUpdate();
    }
  }

  async function unban() {
    setIsPending(true);
    const res = await fetch(`/api/admin/users/${user.id}/unban`, { method: "PATCH" });
    setIsPending(false);
    if (!res.ok) {
      toast.error("Failed to unban user");
    } else {
      toast.success("User unbanned");
      setUnbanOpen(false);
      onUpdate();
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 rounded-xl border border-border-default bg-bg-base p-3">
        <UserAvatar user={user} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium text-text-base">{user.full_name}</span>
            {user.role === "admin" && <Shield size={12} className="shrink-0 text-brand-500" />}
          </div>
          <p className="truncate text-xs text-text-muted-fg">{user.email}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {user.is_banned ? (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400">
              Banned
            </span>
          ) : null}
          {!isCurrentUser &&
            user.role !== "admin" &&
            (user.is_banned ? (
              <Button size="sm" variant="outline" onClick={() => setUnbanOpen(true)}>
                <UserCheck size={14} className="mr-1" />
                Unban
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/20"
                onClick={() => setBanOpen(true)}
              >
                <Ban size={14} className="mr-1" />
                Ban
              </Button>
            ))}
        </div>
      </div>

      <ConfirmDialog
        open={banOpen}
        onOpenChange={setBanOpen}
        title="Ban this user?"
        description={`${user.full_name} (${user.email}) will be banned and blocked from signing in.`}
        confirmLabel="Ban User"
        variant="destructive"
        isLoading={isPending}
        onConfirm={() => void ban()}
      />
      <ConfirmDialog
        open={unbanOpen}
        onOpenChange={setUnbanOpen}
        title="Unban this user?"
        description={`${user.full_name} will be able to sign in again.`}
        confirmLabel="Unban User"
        isLoading={isPending}
        onConfirm={() => void unban()}
      />
    </>
  );
}
