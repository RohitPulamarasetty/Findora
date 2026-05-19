import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: item } = await supabase
    .from("items")
    .select("user_id, status")
    .eq("id", id)
    .single();

  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  // Only the item reporter can resolve a case.
  if (item.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Allow resolution from any open state; block if already resolved/closed.
  if (["completed", "closed"].includes(item.status)) {
    return NextResponse.json({ error: "This item is already resolved." }, { status: 400 });
  }

  // Mark item completed and lock all conversations for this item
  const [{ data, error }, { error: convErr }] = await Promise.all([
    supabase.from("items").update({ status: "completed" }).eq("id", id).select().single(),
    supabase.from("conversations").update({ is_locked: true }).eq("item_id", id),
  ]);

  if (error || convErr) {
    return NextResponse.json({ error: error?.message ?? convErr?.message }, { status: 500 });
  }

  // Insert system message in all conversations for this item
  const { data: convos } = await supabase.from("conversations").select("id").eq("item_id", id);

  if (convos?.length) {
    await supabase.from("messages").insert(
      convos.map((c) => ({
        conversation_id: c.id,
        content: "This item has been marked as recovered. The conversation is now closed.",
        is_system: true,
        sender_id: null,
      }))
    );
  }

  return NextResponse.json(data);
}
