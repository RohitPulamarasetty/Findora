import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createItemSchema } from "@/lib/validations";
import { containsProfanity } from "@/lib/profanity";
import { RATE_LIMIT_ITEMS_PER_HOUR } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";
import { checkDedup, storeDedup } from "@/lib/request-dedup";

// `items` has TWO foreign keys to `users` (`user_id` → reporter; `resolved_by`
// → who resolved the case, added in 0012). PostgREST refuses to auto-resolve
// the `users(...)` embed when there's more than one FK and returns a 500.
// We pin the FK explicitly by constraint name so the embed is unambiguous.
const BASE_SELECT = `*, user:users!items_user_id_fkey(id, full_name, avatar_url), images:item_images(id, url, storage_path, created_at)`;

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // ── Rate limit reads — search/feed traffic from clients. Identifier
  // prefers the auth user when available, falls back to IP for guests.
  const {
    data: { user: rlUser },
  } = await supabase.auth.getUser();
  const rl = await rateLimit(request, "items_read", { userId: rlUser?.id });
  if (!rl.allowed) return rl.response!;
  const { searchParams } = new URL(request.url);

  const type = searchParams.get("type");
  const search = searchParams.get("search")?.trim() ?? "";
  const category = searchParams.get("category");
  const status = searchParams.get("status") ?? "active";
  const cursor = searchParams.get("cursor");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);

  type FuzzyRow = { item_id: string; rank: number };
  let data: unknown[] | null = null;
  let fetchError: { message: string } | null = null;

  // ── Feed query builder (no-search + fallback) ───────────────────────────────
  const runQuery = async (useIlike: boolean) => {
    let q = supabase
      .from("items")
      .select(BASE_SELECT)
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (type && type !== "all") q = q.eq("type", type as "lost" | "found");
    // Lifecycle-aware filtering:
    //   active     → only `active` rows (default public feed)
    //   completed  → resolved/recovered cases (success view)
    //   all        → everything except `removed` (so soft-deleted rows
    //                never leak into any user-facing list; admin pages
    //                query the table directly when they need them)
    if (status === "active") {
      q = q.eq("status", "active");
    } else if (status === "completed") {
      q = q.in("status", ["completed", "resolved", "closed"]);
    } else {
      q = q.neq("status", "removed");
    }
    if (category) q = q.in("category", category.split(","));
    if (dateFrom) q = q.gte("date_occurred", dateFrom);
    if (dateTo) q = q.lte("date_occurred", dateTo);
    if (cursor) q = q.lt("created_at", cursor);

    if (search.length > 0) {
      if (useIlike) {
        const escaped = search.replace(/[%_\\]/g, "\\$&");
        const pattern = `%${escaped}%`;
        q = q.or(
          `title.ilike.${pattern},description.ilike.${pattern},location.ilike.${pattern},category.ilike.${pattern}`
        );
      } else {
        const ftsTerms = search
          .split(/\s+/)
          .filter(Boolean)
          .map((w) => w.replace(/[^a-zA-Z0-9]/g, ""))
          .filter(Boolean);
        if (ftsTerms.length > 0) {
          const ftsQuery = ftsTerms.map((t) => `${t}:*`).join(" & ");
          q = q.textSearch("search_vector", ftsQuery, { type: "plain" });
        } else {
          return { data: null, error: null, isEmpty: true };
        }
      }
    }

    const { data: rows, error } = await q;
    return { data: rows, error, isEmpty: false };
  };

  // ── Search path ─────────────────────────────────────────────────────────────
  if (search.length >= 2) {
    // Primary strategy: pg_trgm fuzzy RPC (typo-tolerant + relevance-ranked).
    // Returns IDs sorted by score; we then fetch full rows with joins.
    // Falls back gracefully to FTS + ilike if the extension isn't applied yet.
    let usedFuzzy = false;
    try {
      const { data: fuzzyRows, error: rpcError } = await supabase.rpc("find_fuzzy_item_ids", {
        p_query: search,
        p_type: type && type !== "all" ? type : null,
        p_status: status,
        p_categories: category ? category.split(",") : null,
        p_date_from: dateFrom ?? null,
        p_date_to: dateTo ?? null,
        p_limit: 50, // search results are relevance-ranked, not cursor-paginated
      });

      if (!rpcError && fuzzyRows !== null) {
        usedFuzzy = true;
        const rows = fuzzyRows as FuzzyRow[];

        if (rows.length === 0) {
          data = [];
        } else {
          const ids = rows.map((r) => r.item_id);
          const { data: items, error: itemsError } = await supabase
            .from("items")
            .select(BASE_SELECT)
            .in("id", ids);

          if (itemsError) {
            fetchError = itemsError;
          } else {
            // Re-sort by the rank returned by the RPC (in() doesn't preserve order)
            const rankMap = new Map(rows.map((r) => [r.item_id, r.rank]));
            data = (items ?? []).sort(
              (a, b) =>
                (rankMap.get((b as { id: string }).id) ?? 0) -
                (rankMap.get((a as { id: string }).id) ?? 0)
            );
          }
        }
      } else if (rpcError) {
        console.warn("[search] pg_trgm RPC unavailable, falling back:", rpcError.message);
      }
    } catch (e) {
      console.warn("[search] RPC exception, falling back:", e);
    }

    // Fallback: FTS prefix → ilike (runs when RPC not yet applied)
    if (!usedFuzzy && data === null) {
      const ftsResult = await runQuery(false);
      if (!ftsResult.error && !ftsResult.isEmpty && ftsResult.data && ftsResult.data.length > 0) {
        data = ftsResult.data;
      } else {
        const ilikeResult = await runQuery(true);
        if (ilikeResult.error) fetchError = ilikeResult.error;
        else data = ilikeResult.data ?? [];
      }
    }
  } else if (search.length === 1) {
    // Single char — ilike only
    const ilikeResult = await runQuery(true);
    if (ilikeResult.error) fetchError = ilikeResult.error;
    else data = ilikeResult.data ?? [];
  } else {
    // No search — cursor-paginated feed
    const result = await runQuery(false);
    if (result.error) fetchError = result.error;
    else data = result.data ?? [];
  }

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  // For search results (fuzzy path) we return all ranked items without cursor.
  // For the feed (no search) we apply the limit+1 cursor trick.
  if (search.length >= 2) {
    return NextResponse.json({ items: data ?? [], nextCursor: null });
  }

  const items = data ?? [];
  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? (page[page.length - 1] as { created_at: string }).created_at : null;

  return NextResponse.json({ items: page, nextCursor });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Edge limiter — protects the DB-backed hourly limit below from being
  // hammered. Distinct bucket from the read path.
  const rl = await rateLimit(request, "items_write", { userId: user.id });
  if (!rl.allowed) return rl.response!;

  // Check ban status — maybeSingle() avoids a PGRST116 error log when the
  // profile row doesn't exist yet. Missing profile is not a ban.
  const { data: profile } = await supabase
    .from("users")
    .select("is_banned")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.is_banned === true) return NextResponse.json({ error: "Account suspended" }, { status: 403 });

  // Rate limit
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", oneHourAgo);
  if ((count ?? 0) >= RATE_LIMIT_ITEMS_PER_HOUR) {
    return NextResponse.json(
      { error: `You can only report ${RATE_LIMIT_ITEMS_PER_HOUR} items per hour.` },
      { status: 429 }
    );
  }

  const body = await request.json();
  const parsed = createItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { title, description, location } = parsed.data;
  if (containsProfanity(title) || containsProfanity(description) || containsProfanity(location)) {
    return NextResponse.json(
      { error: "Content contains inappropriate language." },
      { status: 400 }
    );
  }

  // 5-second dedup: two identical submits from the same user (double-tap,
  // network retry, concurrent tabs) within 5 s must create exactly ONE item.
  // Key: user + type + first 80 chars of title (enough to distinguish items
  // without encoding entire payloads in the Redis key).
  const dedupKey = `dedup:items:create:${user.id}:${encodeURIComponent(`${parsed.data.type}:${parsed.data.title}`).slice(0, 100)}`;
  const dedupHit = await checkDedup<string>(dedupKey);
  if (dedupHit.isDuplicate) {
    // eslint-disable-next-line no-console
    console.info(
      JSON.stringify({
        ts: new Date().toISOString(),
        route: "items/create",
        event: "duplicate_submit_blocked",
        user_id: user.id,
        existing_item_id: dedupHit.value,
      })
    );
    // Return the original item so the client can navigate to it normally.
    const { data: existing } = await supabase
      .from("items")
      .select()
      .eq("id", dedupHit.value)
      .single();
    if (existing) return NextResponse.json(existing, { status: 200 });
  }

  const { data, error } = await supabase
    .from("items")
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Register the new item in the dedup store so concurrent/rapid identical
  // requests within the next 5 s resolve to this row instead of a duplicate.
  await storeDedup(dedupKey, data.id, 5);

  return NextResponse.json(data, { status: 201 });
}
