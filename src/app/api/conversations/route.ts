import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ── PERF (mig. 0014) ─────────────────────────────────────────────────────
  // Single round-trip fetch via SQL function get_user_conversations(uuid).
  // Replaces the previous 1+N pattern (1 conversations + N latest-message
  // lookups). The function uses DISTINCT ON over messages_conversation_idx
  // so the latest-message join is O(log N) per conversation, server-side.
  // ────────────────────────────────────────────────────────────────────────
  const { data: rows, error } = await supabase.rpc(
    "get_user_conversations" as never,
    {
      p_user_id: user.id,
    } as never
  );

  if (error) {
    // Defensive fallback in case 0014 hasn't been applied yet against the
    // connected database. Keeps the route working during a partial deploy.
    if ((error as { code?: string }).code === "42883" /* undefined_function */) {
      return legacyConversationsFallback(supabase, user.id);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = (rows ?? []) as Array<{
    id: string;
    item_id: string;
    owner_id: string;
    finder_id: string;
    is_locked: boolean;
    last_message_at: string | null;
    created_at: string;
    updated_at: string;
    unread_count: number;
    other_user_id: string | null;
    other_user_full_name: string | null;
    other_user_avatar_url: string | null;
    item_title: string | null;
    item_type: "lost" | "found" | null;
    last_message_content: string | null;
    last_message_created_at: string | null;
  }>;

  const result = list.map((r) => ({
    id: r.id,
    item_id: r.item_id,
    owner_id: r.owner_id,
    finder_id: r.finder_id,
    is_locked: r.is_locked,
    last_message_at: r.last_message_at,
    created_at: r.created_at,
    updated_at: r.updated_at,
    other_user: r.other_user_id
      ? {
          id: r.other_user_id,
          full_name: r.other_user_full_name,
          avatar_url: r.other_user_avatar_url,
        }
      : null,
    item: r.item_title ? { id: r.item_id, title: r.item_title, type: r.item_type } : null,
    last_message: r.last_message_content
      ? { content: r.last_message_content, created_at: r.last_message_created_at }
      : null,
    unread_count: r.unread_count,
  }));

  return NextResponse.json(result);
}

// Legacy 1+N fan-out. Retained for one release as a safety net if 0014
// hasn't been applied yet. Remove once the RPC is confirmed deployed.
async function legacyConversationsFallback(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data: convos, error } = await supabase
    .from("conversations")
    .select("*")
    .or(`owner_id.eq.${userId},finder_id.eq.${userId}`)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!convos?.length) return NextResponse.json([]);

  const otherIds = Array.from(
    new Set(convos.flatMap((c) => [c.owner_id, c.finder_id]).filter((id) => id !== userId))
  );
  const convoIds = convos.map((c) => c.id);

  const [{ data: users }, { data: items }, lastMessageResults] = await Promise.all([
    supabase.from("users").select("id, full_name, avatar_url").in("id", otherIds),
    supabase
      .from("items")
      .select("id, title, type")
      .in(
        "id",
        convos.map((c) => c.item_id)
      ),
    Promise.all(
      convoIds.map(async (cid) => {
        const { data } = await supabase
          .from("messages")
          .select("content, created_at")
          .eq("conversation_id", cid)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        return [cid, data] as const;
      })
    ),
  ]);

  const userMap = new Map(users?.map((u) => [u.id, u]) ?? []);
  const itemMap = new Map(items?.map((i) => [i.id, i]) ?? []);
  const lastMessageMap = new Map<string, { content: string; created_at: string }>();
  for (const [cid, msg] of lastMessageResults) {
    if (msg) lastMessageMap.set(cid, { content: msg.content, created_at: msg.created_at });
  }

  const result = convos.map((c) => {
    const otherId = c.owner_id === userId ? c.finder_id : c.owner_id;
    return {
      id: c.id,
      item_id: c.item_id,
      owner_id: c.owner_id,
      finder_id: c.finder_id,
      is_locked: c.is_locked,
      last_message_at: c.last_message_at,
      created_at: c.created_at,
      updated_at: c.updated_at,
      other_user: userMap.get(otherId) ?? null,
      item: itemMap.get(c.item_id) ?? null,
      last_message: lastMessageMap.get(c.id) ?? null,
      unread_count: c.owner_id === userId ? c.unread_owner : c.unread_finder,
    };
  });
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(request, "messaging", { userId: user.id });
  if (!rl.allowed) return rl.response!;

  const body = await request.json().catch(() => ({}));
  const { item_id, owner_id } = body as { item_id?: string; owner_id?: string };

  if (!item_id || !owner_id) {
    return NextResponse.json({ error: "item_id and owner_id required" }, { status: 400 });
  }
  if (owner_id === user.id) {
    return NextResponse.json(
      { error: "Cannot start a conversation with yourself" },
      { status: 400 }
    );
  }

  const { data: item } = await supabase
    .from("items")
    .select("id, user_id, status")
    .eq("id", item_id)
    .single();

  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  if (item.status !== "active")
    return NextResponse.json({ error: "Item is no longer active" }, { status: 400 });
  if (item.user_id !== owner_id)
    return NextResponse.json({ error: "owner_id does not match item owner" }, { status: 400 });

  // Return existing conversation if one exists
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("item_id", item_id)
    .eq("finder_id", user.id)
    .single();

  if (existing) return NextResponse.json({ id: existing.id });

  const { data: convo, error } = await supabase
    .from("conversations")
    .insert({ item_id, owner_id, finder_id: user.id })
    .select()
    .single();

  if (error) {
    // 23505 = unique_violation on (item_id, owner_id, finder_id). Two concurrent
    // requests both passed the SELECT check above; the loser lands here. Fetch
    // the row that the winner created and return it as if we found it upfront.
    if ((error as { code?: string }).code === "23505") {
      const { data: race } = await supabase
        .from("conversations")
        .select("id")
        .eq("item_id", item_id)
        .eq("finder_id", user.id)
        .single();
      if (race) return NextResponse.json({ id: race.id });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: convo.id }, { status: 201 });
}
