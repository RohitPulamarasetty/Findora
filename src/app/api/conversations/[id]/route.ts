import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: convo, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !convo) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (convo.owner_id !== user.id && convo.finder_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const otherId = convo.owner_id === user.id ? convo.finder_id : convo.owner_id;

  const [{ data: otherUser }, { data: item }] = await Promise.all([
    supabase.from("users").select("id, full_name, avatar_url").eq("id", otherId).single(),
    supabase.from("items").select("id, title, type").eq("id", convo.item_id).single(),
  ]);

  return NextResponse.json({
    ...convo,
    other_user: otherUser ?? null,
    item: item ?? null,
    unread_count: convo.owner_id === user.id ? convo.unread_owner : convo.unread_finder,
  });
}

// Mark conversation as read (reset unread count for current user)
export async function PATCH(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: convo } = await supabase
    .from("conversations")
    .select("owner_id, finder_id")
    .eq("id", id)
    .single();

  if (!convo) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (convo.owner_id !== user.id && convo.finder_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const update = convo.owner_id === user.id ? { unread_owner: 0 } : { unread_finder: 0 };

  await supabase.from("conversations").update(update).eq("id", id);

  // Also mark all received messages as read
  await supabase
    .from("messages")
    .update({ status: "read" })
    .eq("conversation_id", id)
    .neq("sender_id", user.id)
    .eq("status", "delivered");

  return NextResponse.json({ ok: true });
}
