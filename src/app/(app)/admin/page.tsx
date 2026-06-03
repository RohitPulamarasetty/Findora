import type { Metadata } from "next";
import Link from "next/link";
import {
  Package,
  Users,
  MessageSquare,
  CheckCircle,
  Activity,
  Flag,
  ArrowRight,
  Shield,
  BarChart3,
  Mail,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { AdminStatsCard } from "@/components/features/admin/admin-stats-card";
import { AnalyticsChart } from "@/components/features/admin/analytics-chart";

export const metadata: Metadata = { title: "Admin — Overview" };

interface Analytics {
  total_items: number;
  total_users: number;
  total_conversations: number;
  active_items: number;
  completed_items: number;
  pending_flags: number;
  items_by_day: Array<{ date: string; lost: number; found: number }>;
}

// Direct Supabase query — replaces the broken self-HTTP-fetch pattern.
// Next.js 15 server-component fetch() does NOT forward session cookies,
// so the previous `fetch(/api/admin/analytics)` always got a 403 and
// rendered "Analytics unavailable" for every admin. Querying the DB
// directly (the same queries the API route runs) is the correct approach.
async function fetchAnalytics(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<Analytics | null> {
  try {
    const since14Days = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { count: totalItems },
      { count: totalUsers },
      { count: totalConversations },
      { count: activeItems },
      { count: completedItems },
      { count: pendingFlags },
      { data: recentItems },
    ] = await Promise.all([
      supabase.from("items").select("id", { count: "exact", head: true }),
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase.from("conversations").select("id", { count: "exact", head: true }),
      supabase.from("items").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase
        .from("items")
        .select("id", { count: "exact", head: true })
        .in("status", ["completed", "resolved", "closed"]),
      supabase.from("flags").select("id", { count: "exact", head: true }).eq("is_resolved", false),
      supabase
        .from("items")
        .select("created_at, type")
        .gte("created_at", since14Days)
        .order("created_at", { ascending: true }),
    ]);

    // Build day-by-day chart data for the last 14 days.
    const dayMap = new Map<string, { lost: number; found: number }>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      dayMap.set(d.toISOString().slice(0, 10), { lost: 0, found: 0 });
    }
    for (const item of recentItems ?? []) {
      const key = item.created_at.slice(0, 10);
      const entry = dayMap.get(key);
      if (entry) {
        if (item.type === "lost") entry.lost++;
        else entry.found++;
      }
    }
    const items_by_day = Array.from(dayMap.entries()).map(([date, counts]) => ({
      date,
      ...counts,
    }));

    return {
      total_items: totalItems ?? 0,
      total_users: totalUsers ?? 0,
      total_conversations: totalConversations ?? 0,
      active_items: activeItems ?? 0,
      completed_items: completedItems ?? 0,
      pending_flags: pendingFlags ?? 0,
      items_by_day,
    };
  } catch {
    return null;
  }
}

const QUICK_NAV = [
  { href: "/admin/users", label: "Users", icon: Users, desc: "Manage accounts" },
  { href: "/admin/items", label: "Items", icon: Package, desc: "Review reports" },
  { href: "/admin/flags", label: "Flags", icon: Flag, desc: "Pending reviews" },
  { href: "/admin/banned-emails", label: "Blocked", icon: Mail, desc: "Banned emails" },
  { href: "/admin/conversations", label: "Chats", icon: MessageSquare, desc: "All threads" },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, desc: "Trends & data" },
];

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const data = await fetchAnalytics(supabase);

  const recoveryRate =
    data && data.completed_items + data.active_items > 0
      ? Math.round((data.completed_items / (data.completed_items + data.active_items)) * 100)
      : 0;

  return (
    <main className="page-safe-bottom">
      {/* Page header */}
      <div className="border-b border-border-default bg-bg-base/90 px-4 py-5 backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-[0_4px_14px_rgb(var(--color-brand-500)/0.40)]">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-[16px] font-bold tracking-tight text-text-base">Admin Dashboard</h1>
            <p className="text-[12px] text-text-muted-fg">Platform overview &amp; moderation</p>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-4 py-5 sm:px-6">
        {/* Quick navigation grid */}
        <section>
          <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted-fg">
            Sections
          </h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {QUICK_NAV.map(({ href, label, icon: Icon, desc }) => (
              <Link
                key={href}
                href={href}
                className="group flex flex-col items-center gap-1.5 rounded-xl border border-border-default bg-bg-subtle p-3 text-center transition-all hover:border-brand-500/25 hover:bg-bg-muted-surface hover:shadow-[0_4px_12px_rgb(var(--color-brand-500)/0.10)]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-base shadow-sm transition-colors group-hover:bg-brand-500/10">
                  <Icon
                    size={16}
                    className="text-text-secondary transition-colors group-hover:text-brand-500"
                  />
                </div>
                <span className="text-[11px] font-semibold text-text-base">{label}</span>
                <span className="hidden text-[10px] text-text-muted-fg sm:block">{desc}</span>
              </Link>
            ))}
          </div>
        </section>

        {data ? (
          <>
            {/* Stats grid */}
            <section>
              <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted-fg">
                Overview
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <AdminStatsCard icon={Package} label="Total Items" value={data.total_items} />
                <AdminStatsCard icon={Users} label="Registered Users" value={data.total_users} />
                <AdminStatsCard
                  icon={Activity}
                  label="Active Items"
                  value={data.active_items}
                  accent="green"
                />
                <AdminStatsCard
                  icon={CheckCircle}
                  label="Recovered"
                  value={data.completed_items}
                  accent="green"
                />
                <AdminStatsCard
                  icon={MessageSquare}
                  label="Conversations"
                  value={data.total_conversations}
                />
                <AdminStatsCard
                  icon={Flag}
                  label="Pending Flags"
                  value={data.pending_flags}
                  accent={data.pending_flags > 0 ? "amber" : "default"}
                />
              </div>
            </section>

            {/* Recovery rate + chart */}
            <section className="grid gap-4 sm:grid-cols-3">
              {/* Recovery rate widget */}
              {data.completed_items + data.active_items > 0 && (
                <div className="from-emerald-500/8 rounded-xl border border-border-default bg-gradient-to-br to-teal-500/5 p-4">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-text-muted-fg">
                    Recovery Rate
                  </p>
                  <p className="text-3xl font-bold tabular-nums text-text-base">
                    {recoveryRate}
                    <span className="text-lg text-text-secondary">%</span>
                  </p>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border-default">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700"
                      style={{ width: `${recoveryRate}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-text-muted-fg">
                    {data.completed_items} of {data.completed_items + data.active_items} resolved or
                    active
                  </p>
                  <Link
                    href="/admin/items"
                    className="mt-3 flex items-center gap-1 text-[11px] text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    View all items
                    <ArrowRight size={11} />
                  </Link>
                </div>
              )}

              {/* Chart */}
              <div
                className={`rounded-xl border border-border-default bg-bg-base p-4 ${data.total_items > 0 ? "sm:col-span-2" : "sm:col-span-3"}`}
              >
                <h2 className="mb-4 flex items-center gap-2 text-[13px] font-semibold text-text-base">
                  <BarChart3 size={14} className="text-brand-500" />
                  Items Reported — Last 14 Days
                </h2>
                <AnalyticsChart data={data.items_by_day} />
              </div>
            </section>

            {/* Flags callout */}
            {data.pending_flags > 0 && (
              <div className="bg-amber-500/6 flex items-center justify-between rounded-xl border border-amber-500/25 px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <Flag size={15} className="text-amber-500" />
                  <span className="text-[13px] font-medium text-text-base">
                    {data.pending_flags} flag{data.pending_flags !== 1 ? "s" : ""} need review
                  </span>
                </div>
                <Link
                  href="/admin/flags"
                  className="flex items-center gap-1 text-[12px] font-medium text-amber-600 hover:underline dark:text-amber-400"
                >
                  Review
                  <ArrowRight size={11} />
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-border-default bg-bg-subtle p-8 text-center">
            <BarChart3 size={24} className="mx-auto mb-2 text-text-muted-fg" />
            <p className="text-[13px] font-medium text-text-base">Analytics unavailable</p>
            <p className="mt-1 text-[12px] text-text-muted-fg">Could not load platform data.</p>
          </div>
        )}
      </div>
    </main>
  );
}
