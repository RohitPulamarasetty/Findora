import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(request, "admin", { userId: user.id });
  if (!rl.allowed) return rl.response!;

  const { data: admin } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (admin?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // ── Lifecycle: soft-remove by default; hard-delete only on explicit opt-in
  // (?hard=1). Soft path preserves the row for analytics, recovery history,
  // and audit trail. Hard path is reserved for spam/abuse purges.
  const url = new URL(request.url);
  const hardDelete = url.searchParams.get("hard") === "1";

  if (hardDelete) {
    const { data: images } = await supabase
      .from("item_images")
      .select("storage_path")
      .eq("item_id", id);

    if (images?.length) {
      await supabase.storage.from("item-images").remove(images.map((img) => img.storage_path));
    }

    const { error } = await supabase.from("items").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, mode: "hard" });
  }

  const { error } = await supabase
    .from("items")
    .update({
      status: "removed",
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
      resolution_note: "Removed by admin",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, mode: "soft" });
}
