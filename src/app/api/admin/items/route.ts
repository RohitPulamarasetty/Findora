import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

// Admin-only items list endpoint.
// Unlike GET /api/items (which always excludes status="removed"), this
// endpoint returns every row in the items table — including soft-deleted
// ones — so admins have a complete audit trail.
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(request, "admin", { userId: user.id });
  if (!rl.allowed) return rl.response!;

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);
  const rawCursor = searchParams.get("cursor");
  const cursor = rawCursor && !isNaN(Date.parse(rawCursor)) ? rawCursor : null;

  let q = supabase
    .from("items")
    .select(
      `id, title, type, status, category, created_at, user_id,
       user:users!items_user_id_fkey(id, full_name, avatar_url)`
    )
    .order("created_at", { ascending: false })
    .limit(limit + 1);
  // No status filter — intentionally includes removed items for admin audit.

  if (search) {
    const escaped = search.replace(/[%_\\]/g, "\\$&");
    const pattern = `%${escaped}%`;
    q = q.or(`title.ilike.${pattern},category.ilike.${pattern}`);
  }

  if (cursor) q = q.lt("created_at", cursor);

  const { data: rows, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = rows ?? [];
  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? page[page.length - 1].created_at : null;

  return NextResponse.json({ items: page, nextCursor });
}
