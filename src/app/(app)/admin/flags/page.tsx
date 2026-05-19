"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Flag, CheckCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import type { FlagReason } from "@/types/database";

interface FlagItem {
  id: string;
  reason: FlagReason;
  notes: string | null;
  is_resolved: boolean;
  created_at: string;
  item_id: string | null;
  reporter: { full_name: string; email: string } | null;
  item: { id: string; title: string } | null;
}

interface FlagsResponse {
  flags: FlagItem[];
  total: number;
}

const REASON_LABELS: Record<FlagReason, string> = {
  spam: "Spam",
  inappropriate: "Inappropriate",
  fake: "Fake / Misleading",
  duplicate: "Duplicate",
  other: "Other",
};

export default function AdminFlagsPage() {
  const [showResolved, setShowResolved] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery<FlagsResponse>({
    queryKey: ["admin", "flags", showResolved],
    queryFn: async () => {
      const res = await fetch(`/api/admin/flags?resolved=${showResolved}`);
      if (!res.ok) throw new Error("Failed to fetch flags");
      return res.json();
    },
  });

  async function resolve(flagId: string) {
    setResolvingId(flagId);
    const res = await fetch(`/api/admin/flags/${flagId}/resolve`, { method: "PATCH" });
    setResolvingId(null);
    if (!res.ok) {
      toast.error("Failed to resolve flag");
    } else {
      toast.success("Flag resolved");
      void refetch();
    }
  }

  return (
    <main className="page-safe-bottom px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-text-base">
          Flagged Content {data?.total ? `(${data.total})` : ""}
        </h1>
        <button
          onClick={() => setShowResolved((v) => !v)}
          className="text-xs text-brand-500 underline hover:text-brand-600 dark:text-brand-400"
        >
          {showResolved ? "Show pending" : "Show resolved"}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-bg-subtle" />
          ))}
        </div>
      ) : !data?.flags.length ? (
        <EmptyState
          icon={<Flag size={32} className="text-text-muted-fg" aria-hidden="true" />}
          title={showResolved ? "No resolved flags" : "No pending flags"}
          description={
            showResolved ? "Resolved reports appear here." : "No content has been flagged yet."
          }
        />
      ) : (
        <div className="space-y-2">
          {data.flags.map((flag) => (
            <div key={flag.id} className="rounded-xl border border-border-default bg-bg-base p-4">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                      {REASON_LABELS[flag.reason]}
                    </span>
                    {flag.item && (
                      <Link
                        href={`/items/${flag.item.id}`}
                        className="flex items-center gap-1 text-xs text-brand-500 hover:underline dark:text-brand-400"
                        target="_blank"
                      >
                        {flag.item.title}
                        <ExternalLink size={10} />
                      </Link>
                    )}
                  </div>
                  {flag.notes && <p className="mt-1 text-xs text-text-secondary">{flag.notes}</p>}
                  <p className="mt-1 text-xs text-text-muted-fg">
                    by {flag.reporter?.full_name ?? "Unknown"} ·{" "}
                    {new Date(flag.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
                {!flag.is_resolved && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void resolve(flag.id)}
                    disabled={resolvingId === flag.id}
                  >
                    <CheckCircle size={14} className="mr-1 text-emerald-500" />
                    Resolve
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
