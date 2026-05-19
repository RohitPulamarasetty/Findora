import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: admin } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (admin?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Delete images from storage first
  const { data: images } = await supabase
    .from("item_images")
    .select("storage_path")
    .eq("item_id", id);

  if (images?.length) {
    await supabase.storage.from("item-images").remove(images.map((img) => img.storage_path));
  }

  const { error } = await supabase.from("items").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
