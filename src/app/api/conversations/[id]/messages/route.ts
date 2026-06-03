import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { sendMessageSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Maximum messages returned per request. The realtime subscription in
// use-messages.ts appends new messages incrementally, so the initial load
// only needs to cover conversation history. 200 is generous for a campus
// lost-and-found context while preventing unbounded payloads on long threads.
const MESSAGES_LOAD_LIMIT = 200;

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate-limit reads — consistent with the write path.
  const rl = await rateLimit(request, "messaging", { userId: user.id });
  if (!rl.allowed) return rl.response!;

  const { data: convo } = await supabase
    .from("conversations")
    .select("owner_id, finder_id")
    .eq("id", id)
    .single();

  if (!convo) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (convo.owner_id !== user.id && convo.finder_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch the most-recent MESSAGES_LOAD_LIMIT messages, then reverse so
  // the client receives them in ascending chronological order (oldest first).
  // Ordering DESC + limit is more index-efficient than ASC + limit when a
  // conversation has thousands of rows — it avoids a full sequential scan.
  const { data: messages, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: false })
    .limit(MESSAGES_LOAD_LIMIT);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Re-sort ascending for the client (oldest → newest).
  const ordered = (messages ?? []).reverse();
  return NextResponse.json(ordered);
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(request, "messaging", { userId: user.id });
  if (!rl.allowed) return rl.response!;

  const { data: convo } = await supabase
    .from("conversations")
    .select("owner_id, finder_id, is_locked")
    .eq("id", id)
    .single();

  if (!convo) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (convo.owner_id !== user.id && convo.finder_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (convo.is_locked) {
    return NextResponse.json({ error: "This conversation is locked" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: id,
      sender_id: user.id,
      content: parsed.data.content,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(message, { status: 201 });
}
