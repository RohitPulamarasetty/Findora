import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { createFlagSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(request, "flags", { userId: user.id });
  if (!rl.allowed) return rl.response!;

  const body = await request.json().catch(() => ({}));
  const parsed = createFlagSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { item_id, message_id, reason, notes } = parsed.data;
  if (!item_id && !message_id) {
    return NextResponse.json(
      { error: "Either item_id or message_id is required" },
      { status: 400 }
    );
  }

  // Check user hasn't already flagged this target
  const query = supabase.from("flags").select("id").eq("reporter_id", user.id);

  const existing = item_id
    ? await query.eq("item_id", item_id).single()
    : await query.eq("message_id", message_id!).single();

  if (existing.data) {
    return NextResponse.json({ error: "You have already flagged this" }, { status: 409 });
  }

  const { data: flag, error } = await supabase
    .from("flags")
    .insert({
      reporter_id: user.id,
      item_id: item_id ?? null,
      message_id: message_id ?? null,
      reason,
      notes: notes ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(flag, { status: 201 });
}
