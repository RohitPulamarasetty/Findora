import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { updateItemSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("items")
    .select(
      // Pin the FK (items has two refs to users: user_id + resolved_by).
      `*, user:users!items_user_id_fkey(id, full_name, avatar_url), images:item_images(id, url, storage_path, created_at)`
    )
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(request, "items_write", { userId: user.id });
  if (!rl.allowed) return rl.response!;

  const { data: item } = await supabase.from("items").select("user_id").eq("id", id).single();
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();

  const isOwner = item?.user_id === user.id;
  const isAdmin = profile?.role === "admin";
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = updateItemSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { data, error } = await supabase
    .from("items")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(request, "items_write", { userId: user.id });
  if (!rl.allowed) return rl.response!;

  const { data: item } = await supabase.from("items").select("user_id").eq("id", id).single();
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();

  if (item?.user_id !== user.id && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Soft remove — preserve historical proof, analytics, and any
  // conversations attached to the case. Hard-delete is reserved for admins
  // and must be requested explicitly via ?hard=1. Default is soft.
  const url = new URL(request.url);
  const hardRequested = url.searchParams.get("hard") === "1";
  const allowHard = profile?.role === "admin" && hardRequested;

  if (allowHard) {
    const { error } = await supabase.from("items").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return new NextResponse(null, { status: 204 });
  }

  const { error } = await supabase
    .from("items")
    .update({ status: "removed", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
