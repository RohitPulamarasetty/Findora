import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch counts in parallel
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
      .in("status", ["completed", "closed"]),
    supabase.from("flags").select("id", { count: "exact", head: true }).eq("is_resolved", false),
    supabase
      .from("items")
      .select("created_at, type")
      .gte("created_at", since14Days)
      .order("created_at", { ascending: true }),
  ]);

  // Group items by day for chart
  const dayMap = new Map<string, { lost: number; found: number }>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    dayMap.set(key, { lost: 0, found: 0 });
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

  return NextResponse.json({
    total_items: totalItems ?? 0,
    total_users: totalUsers ?? 0,
    total_conversations: totalConversations ?? 0,
    active_items: activeItems ?? 0,
    completed_items: completedItems ?? 0,
    pending_flags: pendingFlags ?? 0,
    items_by_day,
  });
}
