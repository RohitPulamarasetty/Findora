"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail, Plus, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";

interface BannedEmail {
  id: string;
  email: string;
  reason: string | null;
  created_at: string;
}

export default function AdminBannedEmailsPage() {
  const [newEmail, setNewEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);

  const {
    data: banned,
    isLoading,
    refetch,
  } = useQuery<BannedEmail[]>({
    queryKey: ["admin", "banned-emails"],
    queryFn: async () => {
      const res = await fetch("/api/admin/banned-emails");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  async function addEmail() {
    if (!newEmail.trim()) return;
    setIsAdding(true);
    const res = await fetch("/api/admin/banned-emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail.trim() }),
    });
    setIsAdding(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Failed to add email");
    } else {
      toast.success("Email banned");
      setNewEmail("");
      void refetch();
    }
  }

  async function removeEmail(email: string) {
    setRemovingEmail(email);
    const res = await fetch(`/api/admin/banned-emails?email=${encodeURIComponent(email)}`, {
      method: "DELETE",
    });
    setRemovingEmail(null);
    if (!res.ok) {
      toast.error("Failed to remove ban");
    } else {
      toast.success("Email unbanned");
      void refetch();
    }
  }

  return (
    <main className="page-safe-bottom px-4 py-6">
      <h1 className="mb-4 text-lg font-bold text-text-base">Banned Emails</h1>

      {/* Add form */}
      <div className="mb-6 flex gap-2">
        <Input
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="email@example.com"
          type="email"
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") void addEmail();
          }}
        />
        <Button onClick={() => void addEmail()} disabled={!newEmail.trim() || isAdding}>
          <Plus size={16} className="mr-1" />
          Ban
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-bg-subtle" />
          ))}
        </div>
      ) : !banned?.length ? (
        <EmptyState
          icon={<Mail size={32} className="text-text-muted-fg" aria-hidden="true" />}
          title="No banned emails"
          description="Emails you ban will be blocked from signing in."
        />
      ) : (
        <div className="space-y-2">
          {banned.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 rounded-xl border border-border-default bg-bg-base p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-base">{entry.email}</p>
                <p className="text-xs text-text-muted-fg">
                  {entry.reason ?? "No reason"} ·{" "}
                  {new Date(entry.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-500 hover:text-red-600"
                onClick={() => void removeEmail(entry.email)}
                disabled={removingEmail === entry.email}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
