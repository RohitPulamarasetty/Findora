import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: convos, error } = await supabase
    .from("conversations")
    .select("*")
    .or(`owner_id.eq.${user.id},finder_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!convos?.length) return NextResponse.json([]);

  // Collect unique other-user IDs
  const otherIds = Array.from(
    new Set(convos.flatMap((c) => [c.owner_id, c.finder_id]).filter((id) => id !== user.id))
  );

  const convoIds = convos.map((c) => c.id);

  // ── PERF ─────────────────────────────────────────────────────────────────
  // Previously this route fetched EVERY message across ALL the user's
  // conversations (`select ... order created_at desc`) just to pick the most
  // recent per conversation. For a heavy user that meant pulling thousands
  // of rows on every list refresh + every realtime event.
  //
  // We now fan out one `.limit(1)` query per conversation in parallel. Each
  // query is fully covered by the `messages_conversation_idx` index on
  // (conversation_id, created_at) — so they're O(1) lookups, not scans.
  // Result: bounded payload (one row per convo) and dramatically less I/O.
  // ────────────────────────────────────────────────────────────────────────
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
    const otherId = c.owner_id === user.id ? c.finder_id : c.owner_id;
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
      unread_count: c.owner_id === user.id ? c.unread_owner : c.unread_finder,
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: convo.id }, { status: 201 });
}
