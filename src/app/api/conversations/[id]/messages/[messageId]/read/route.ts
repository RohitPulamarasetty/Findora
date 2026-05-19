import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ id: string; messageId: string }>;
}

export async function PATCH(_req: Request, { params }: RouteContext) {
  const { id, messageId } = await params;
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

  const { error } = await supabase
    .from("messages")
    .update({ status: "read" })
    .eq("id", messageId)
    .eq("conversation_id", id)
    .neq("sender_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
