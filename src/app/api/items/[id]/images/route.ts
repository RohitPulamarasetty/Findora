import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient, createAdminClient } from "@/utils/supabase/server";
import { MAX_ITEM_IMAGES, MAX_IMAGE_SIZE_MB, ALLOWED_IMAGE_TYPES } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";
import { detectImageMime } from "@/lib/file-magic";

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

  // Strict upload bucket — multipart uploads are the most expensive route.
  const rl = await rateLimit(request, "uploads", { userId: user.id });
  if (!rl.allowed) return rl.response!;

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

  // Check existing image count.
  // Known race: two concurrent uploads both reading count=N-1 could both
  // pass and produce N+1 images. The window is narrow (ms), the consequence
  // is one extra image, and the DB has no count constraint to enforce here.
  // We log when the count is already at the limit so operations can monitor
  // for abuse; a DB-level CHECK constraint can close this fully in a future
  // migration if it becomes a problem.
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
  if ((count ?? 0) === MAX_ITEM_IMAGES - 1) {
    // Concurrent upload may arrive here simultaneously. Log so we can track
    // whether this race is hit in practice.
    // eslint-disable-next-line no-console
    console.info(
      JSON.stringify({
        ts: new Date().toISOString(),
        route: "items/images",
        event: "upload_at_limit_boundary",
        item_id: id,
        current_count: count,
      })
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

  // Read bytes once and verify the actual file signature. Refuses uploads
  // whose claimed Content-Type disagrees with the on-the-wire magic bytes
  // (defends against MIME-spoofed HTML / SVG / arbitrary payloads).
  const bytes = await file.arrayBuffer();
  const sniffedMime = detectImageMime(new Uint8Array(bytes, 0, Math.min(bytes.byteLength, 16)));
  if (!sniffedMime) {
    return NextResponse.json(
      { error: "File content is not a recognized image (JPEG, PNG, or WebP)." },
      { status: 400 }
    );
  }
  if (sniffedMime !== file.type) {
    return NextResponse.json(
      { error: "File content does not match the declared image type." },
      { status: 400 }
    );
  }

  const ext = sniffedMime === "image/webp" ? "webp" : sniffedMime === "image/png" ? "png" : "jpg";
  const storagePath = `${user.id}/${id}/${Date.now()}.${ext}`;

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
