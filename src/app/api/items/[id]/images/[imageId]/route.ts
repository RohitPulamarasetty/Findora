import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

interface RouteParams {
  params: Promise<{ id: string; imageId: string }>;
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id, imageId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: item } = await supabase.from("items").select("user_id").eq("id", id).single();
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();

  if (item?.user_id !== user.id && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: image } = await supabase
    .from("item_images")
    .select("storage_path")
    .eq("id", imageId)
    .eq("item_id", id)
    .single();

  if (!image) return NextResponse.json({ error: "Image not found" }, { status: 404 });

  await supabase.storage.from("item-images").remove([image.storage_path]);
  await supabase.from("item_images").delete().eq("id", imageId);

  return new NextResponse(null, { status: 204 });
}
