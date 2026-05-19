import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient, createAdminClient } from "@/utils/supabase/server";
import { MAX_ITEM_IMAGES, MAX_IMAGE_SIZE_MB, ALLOWED_IMAGE_TYPES } from "@/lib/constants";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  // Use anon+cookie client for auth/ownership checks (respects session)
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check item ownership
  const { data: item, error: itemError } = await supabase
    .from("items")
    .select("user_id")
    .eq("id", id)
    .single();

  if (itemError) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  if (!item || item.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check existing image count
  const { count, error: countError } = await supabase
    .from("item_images")
    .select("id", { count: "exact", head: true })
    .eq("item_id", id);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }
  if ((count ?? 0) >= MAX_ITEM_IMAGES) {
    return NextResponse.json(
      { error: `Maximum ${MAX_ITEM_IMAGES} images allowed per item.` },
      { status: 400 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." },
      { status: 400 }
    );
  }

  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    return NextResponse.json(
      { error: `File too large. Maximum size is ${MAX_IMAGE_SIZE_MB}MB.` },
      { status: 400 }
    );
  }

  const ext = file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
  const storagePath = `${user.id}/${id}/${Date.now()}.${ext}`;

  const bytes = await file.arrayBuffer();

  // Use admin client for storage upload to bypass RLS — auth/ownership already
  // verified above. Anon-key storage uploads can silently fail when the cookie
  // session isn't forwarded correctly by @supabase/ssr.
  const adminSupabase = await createAdminClient();

  const { error: uploadError } = await adminSupabase.storage
    .from("item-images")
    .upload(storagePath, bytes, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = adminSupabase.storage.from("item-images").getPublicUrl(storagePath);

  const { data, error: insertError } = await supabase
    .from("item_images")
    .insert({ item_id: id, storage_path: storagePath, url: publicUrl })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
