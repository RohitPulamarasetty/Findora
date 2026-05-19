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

async function fetchAnalytics(): Promise<Analytics | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/admin/analytics`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return res.json();
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
  const data = await fetchAnalytics();

  return (
    <main className="page-safe-bottom">
      {/* Page header */}
      <div className="border-b border-border-default bg-bg-base px-4 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-sm shadow-brand-500/30">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-text-base">Admin Dashboard</h1>
            <p className="text-xs text-text-muted-fg">Platform overview &amp; moderation</p>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-4 py-5 sm:px-6">
        {/* Quick navigation grid */}
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted-fg">
            Sections
          </h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {QUICK_NAV.map(({ href, label, icon: Icon, desc }) => (
              <Link
                key={href}
                href={href}
                className="group flex flex-col items-center gap-1.5 rounded-xl border border-border-default bg-bg-subtle p-3 text-center transition-all hover:border-border-strong hover:bg-bg-muted-surface"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-base shadow-sm">
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
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted-fg">
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

            {/* Recovery rate + chart side by side on larger screens */}
            <section className="grid gap-4 sm:grid-cols-3">
              {/* Recovery rate widget */}
              {data.total_items > 0 && (
                <div className="rounded-xl border border-border-default bg-gradient-to-br from-emerald-500/5 to-teal-500/5 p-4">
                  <p className="mb-1 text-xs font-medium text-text-muted-fg">Recovery Rate</p>
                  <p className="text-3xl font-bold tabular-nums text-text-base">
                    {Math.round((data.completed_items / data.total_items) * 100)}
                    <span className="text-lg text-text-secondary">%</span>
                  </p>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border-default">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700"
                      style={{
                        width: `${Math.round((data.completed_items / data.total_items) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-text-muted-fg">
                    {data.completed_items} of {data.total_items} items recovered
                  </p>
                  <Link
                    href="/admin/items"
                    className="mt-3 flex items-center gap-1 text-xs text-emerald-600 hover:underline dark:text-emerald-400"
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
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-base">
                  <BarChart3 size={14} className="text-text-muted-fg" />
                  Items Reported — Last 14 Days
                </h2>
                <AnalyticsChart data={data.items_by_day} />
              </div>
            </section>

            {/* Flags callout if pending */}
            {data.pending_flags > 0 && (
              <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Flag size={15} className="text-amber-500" />
                  <span className="text-sm font-medium text-text-base">
                    {data.pending_flags} flag{data.pending_flags !== 1 ? "s" : ""} need review
                  </span>
                </div>
                <Link
                  href="/admin/flags"
                  className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:underline dark:text-amber-400"
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
            <p className="text-sm font-medium text-text-base">Analytics unavailable</p>
            <p className="mt-1 text-xs text-text-muted-fg">Could not load platform data.</p>
          </div>
        )}
      </div>
    </main>
  );
}
