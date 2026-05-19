import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: admin } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (admin?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const resolved = searchParams.get("resolved") === "true";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  const {
    data: flags,
    error,
    count,
  } = await supabase
    .from("flags")
    .select("*", { count: "exact" })
    .eq("is_resolved", resolved)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with reporter info and item/message titles
  const reporterIds = Array.from(new Set((flags ?? []).map((f) => f.reporter_id)));
  const itemIds = (flags ?? []).map((f) => f.item_id).filter(Boolean) as string[];

  const [{ data: reporters }, { data: items }] = await Promise.all([
    reporterIds.length
      ? supabase.from("users").select("id, full_name, email").in("id", reporterIds)
      : Promise.resolve({ data: [] }),
    itemIds.length
      ? supabase.from("items").select("id, title").in("id", itemIds)
      : Promise.resolve({ data: [] }),
  ]);

  const reporterMap = new Map(reporters?.map((r) => [r.id, r]) ?? []);
  const itemMap = new Map(items?.map((i) => [i.id, i]) ?? []);

  const enriched = (flags ?? []).map((f) => ({
    ...f,
    reporter: reporterMap.get(f.reporter_id) ?? null,
    item: f.item_id ? (itemMap.get(f.item_id) ?? null) : null,
  }));

  return NextResponse.json({ flags: enriched, total: count ?? 0, page, limit });
}
