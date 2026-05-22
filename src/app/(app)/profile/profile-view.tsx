"use client";

/**
 * ProfileView — client component island for the /profile page.
 *
 * The parent Server Component (page.tsx) fetches `initialProfile` and
 * `initialItems` at render time and passes them as props. TanStack Query is
 * seeded with that SSR data (no loading flash), then kept in sync via:
 *
 *   • useRealtimeProfile — Supabase postgres_changes for items + users row.
 *   • Tab-visibility refetch — after >60 s hidden, silently invalidates both
 *     profile queries without any spinner or scroll disruption.
 *
 * The name-save callback in EditNameForm optimistically patches the user cache
 * the moment the Supabase write resolves, before the realtime UPDATE arrives.
 */
import { useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Package, CheckCircle2, Clock, TrendingUp, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { UserAvatar } from "@/components/shared/user-avatar";
import { TrustBadge } from "@/components/shared/trust-badge";
import { ItemCard } from "@/components/features/items/item-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageTransition } from "@/components/shared/page-transition";
import { EditNameForm } from "./edit-name-form";
import { useProfileItems } from "@/hooks/use-profile-items";
import { useProfileUser } from "@/hooks/use-profile-user";
import { useRealtimeProfile } from "@/hooks/use-realtime-profile";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import type { ItemWithUser } from "@/types/items";
import type { ProfileUser } from "@/hooks/use-profile-user";

interface ProfileViewProps {
  userId: string;
  initialProfile: ProfileUser;
  initialItems: ItemWithUser[];
}

const accentStyles = {
  brand: {
    bg: "bg-brand-500/10 dark:bg-brand-500/15",
    text: "text-brand-600 dark:text-brand-400",
  },
  amber: {
    bg: "bg-amber-500/10 dark:bg-amber-500/15",
    text: "text-amber-600 dark:text-amber-400",
  },
  green: {
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  violet: {
    bg: "bg-violet-500/10 dark:bg-violet-500/15",
    text: "text-violet-600 dark:text-violet-400",
  },
} as const;

export function ProfileView({ userId, initialProfile, initialItems }: ProfileViewProps) {
  const queryClient = useQueryClient();

  // ── Live data (seeded from SSR initial data) ──────────────────────────────
  const { data: profile } = useProfileUser(userId, initialProfile);
  const { data: items } = useProfileItems(userId, initialItems);

  // ── Realtime subscription ─────────────────────────────────────────────────
  const { refresh } = useRealtimeProfile(userId);

  // ── Tab-visibility refetch (>60 s hidden → silent invalidation) ───────────
  const hiddenAtRef = useRef<number | null>(null);
  const refreshInFlightRef = useRef(false);
  // Keep refresh stable inside the listener via ref.
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now();
      } else if (document.visibilityState === "visible") {
        const hiddenAt = hiddenAtRef.current;
        hiddenAtRef.current = null;
        if (hiddenAt !== null && Date.now() - hiddenAt > 60_000 && !refreshInFlightRef.current) {
          refreshInFlightRef.current = true;
          void refreshRef.current().finally(() => {
            refreshInFlightRef.current = false;
          });
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []); // stable — reads everything via refs

  // ── Name-save optimistic patch ────────────────────────────────────────────
  // Called by EditNameForm right after the Supabase write resolves.  Patches
  // the user cache immediately so the display name updates without waiting for
  // the realtime UPDATE event (which can lag a few hundred ms).
  const handleNameSaved = useCallback(
    (newName: string) => {
      queryClient.setQueryData<ProfileUser>(queryKeys.profile.user(userId), (old) =>
        old ? { ...old, full_name: newName } : old
      );
    },
    [queryClient, userId]
  );

  // ── Derived display data ──────────────────────────────────────────────────
  const liveProfile = profile ?? initialProfile;
  const liveItems = items ?? initialItems;

  const activeItems = liveItems.filter((i) =>
    ["active", "claim_pending", "verified"].includes(i.status)
  );
  const completedItems = liveItems.filter((i) =>
    ["completed", "resolved", "closed"].includes(i.status)
  );
  const recoveryRate =
    liveItems.length > 0 ? Math.round((completedItems.length / liveItems.length) * 100) : 0;

  const joinedDate = new Date(liveProfile.created_at).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const STATS = [
    { icon: Package, label: "Total reports", value: liveItems.length, accent: "brand" },
    { icon: Clock, label: "Active", value: activeItems.length, accent: "amber" },
    { icon: CheckCircle2, label: "Recovered", value: completedItems.length, accent: "green" },
    { icon: TrendingUp, label: "Recovery rate", value: `${recoveryRate}%`, accent: "violet" },
  ] as const;

  return (
    <main className="page-safe-bottom">
      <PageHeader title="Profile" />
      <PageTransition>
        <div className="space-y-5 px-4 py-5">
          {/* ── Identity hero card ───────────────────────────────── */}
          <div className="overflow-hidden rounded-2xl border border-border-default shadow-card">
            {/* Gradient banner */}
            <div className="via-brand-400/12 relative h-[88px] bg-gradient-to-br from-brand-500/25 to-violet-500/10">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bg-subtle/40" />
            </div>
            {/* Content — avatar overlaps banner */}
            <div className="-mt-8 bg-bg-subtle px-5 pb-5">
              <UserAvatar user={liveProfile} size="xl" />
              <div className="mt-3">
                <EditNameForm
                  initialName={liveProfile.full_name}
                  userId={liveProfile.id}
                  onSaveSuccess={handleNameSaved}
                />
                <div className="mt-1.5 flex items-center gap-2">
                  <TrustBadge
                    recoveriesCount={liveProfile.recoveries_count ?? 0}
                    size="md"
                    showCount
                  />
                </div>
                <p className="mt-1.5 truncate text-sm text-text-secondary">{liveProfile.email}</p>
                <p className="mt-1 text-xs text-text-muted-fg">Member since {joinedDate}</p>
              </div>
            </div>
          </div>

          {/* ── Stats ────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STATS.map(({ icon: Icon, label, value, accent }) => {
              const styles = accentStyles[accent];
              return (
                <div
                  key={label}
                  className="flex flex-col gap-3 rounded-2xl border border-border-default bg-bg-subtle p-4 shadow-card"
                >
                  <div
                    className={cn("flex h-9 w-9 items-center justify-center rounded-xl", styles.bg)}
                  >
                    <Icon size={16} className={styles.text} />
                  </div>
                  <div>
                    <div className="text-[26px] font-bold tabular-nums leading-none text-text-base">
                      {value}
                    </div>
                    <div className="mt-1 text-[11px] font-medium text-text-muted-fg">{label}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Active reports ───────────────────────────────────── */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[13px] font-bold tracking-tight text-text-base">
                Active Reports
              </h2>
              <Link
                href="/home"
                className="flex items-center gap-1 text-xs font-semibold text-brand-500 hover:underline dark:text-brand-400"
              >
                View all
                <ArrowRight size={11} />
              </Link>
            </div>
            {activeItems.length === 0 ? (
              <EmptyState
                icon={<Package size={28} className="text-text-muted-fg" aria-hidden="true" />}
                title="No active reports"
                description="Items you're actively tracking will appear here."
                action={{ label: "Report an item", href: "/report" }}
              />
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {activeItems.slice(0, 6).map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </section>

          {/* ── Completed reports ────────────────────────────────── */}
          {completedItems.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[13px] font-bold tracking-tight text-text-base">
                  Recovered Items
                </h2>
                <Link
                  href="/cases/completed"
                  className="flex items-center gap-1 text-xs font-semibold text-brand-500 hover:underline dark:text-brand-400"
                >
                  View all
                  <ArrowRight size={11} />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {completedItems.slice(0, 4).map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}
        </div>
      </PageTransition>
    </main>
  );
}
