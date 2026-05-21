import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { sendMessageSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

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

  const { data: convo } = await supabase
    .from("conversations")
    .select("owner_id, finder_id")
    .eq("id", id)
    .single();

  if (!convo) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (convo.owner_id !== user.id && convo.finder_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: messages, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(messages ?? []);
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
