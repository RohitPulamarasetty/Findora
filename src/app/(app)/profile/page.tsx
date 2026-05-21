import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, CheckCircle2, Clock, TrendingUp, ArrowRight } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ItemCard } from "@/components/features/items/item-card";
import { EmptyState } from "@/components/shared/empty-state";
import { EditNameForm } from "./edit-name-form";
import { PageTransition } from "@/components/shared/page-transition";
import { cn } from "@/lib/utils";
import type { ItemWithUser } from "@/types/items";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile");

  const [{ data: profile }, { data: items }] = await Promise.all([
    supabase.from("users").select("*").eq("id", user.id).single(),
    supabase
      .from("items")
      .select(
        `*, user:users(id, full_name, avatar_url), images:item_images(id, url, storage_path, created_at)`
      )
      .eq("user_id", user.id)
      // Hide soft-removed items from the user's own profile view (admin
      // analytics can still query the table directly).
      .neq("status", "removed")
      .order("created_at", { ascending: false }),
  ]);

  if (!profile) redirect("/login");

  const allItems = (items ?? []) as unknown as ItemWithUser[];
  const activeItems = allItems.filter((i) =>
    ["active", "claim_pending", "verified"].includes(i.status)
  );
  const completedItems = allItems.filter((i) =>
    ["completed", "resolved", "closed"].includes(i.status)
  );

  const joinedDate = new Date(profile.created_at).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const recoveryRate =
    allItems.length > 0 ? Math.round((completedItems.length / allItems.length) * 100) : 0;

  const STATS = [
    { icon: Package, label: "Total reports", value: allItems.length, accent: "brand" },
    { icon: Clock, label: "Active", value: activeItems.length, accent: "amber" },
    { icon: CheckCircle2, label: "Recovered", value: completedItems.length, accent: "green" },
    { icon: TrendingUp, label: "Recovery rate", value: `${recoveryRate}%`, accent: "violet" },
  ] as const;

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
  };

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
              <UserAvatar user={profile} size="xl" />
              <div className="mt-3">
                <EditNameForm initialName={profile.full_name} userId={profile.id} />
                <p className="mt-0.5 truncate text-sm text-text-secondary">{profile.email}</p>
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
