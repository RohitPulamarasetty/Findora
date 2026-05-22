/**
 * Claims API — first-class claim lifecycle.
 *
 *   POST /api/claims        - Create a claim against an item.
 *   GET  /api/claims?item=  - List claims I can see (mine + claims against
 *                             items I own).
 *
 * Decision endpoints (approve/reject) live under /api/claims/[id]/decide.
 *
 * RLS does most authorization; we add lightweight server-side checks for
 * clearer error messages and rate-limiting.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { containsProfanity } from "@/lib/profanity";

interface Answer {
  q: string;
  a: string;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Claims are messaging-adjacent; reuse the messaging bucket so a spammer
  // can't open many claims in parallel as a flood vector.
  const rl = await rateLimit(request, "messaging", { userId: user.id });
  if (!rl.allowed) return rl.response!;

  const body = await request.json().catch(() => ({}));
  const itemId = typeof body.item_id === "string" ? body.item_id : "";
  const rawAnswers: unknown = body.answers;
  const evidenceText = typeof body.evidence_text === "string" ? body.evidence_text.trim() : "";
  const evidenceImageUrl =
    typeof body.evidence_image_url === "string" ? body.evidence_image_url.trim() : "";

  if (!itemId) return NextResponse.json({ error: "item_id is required" }, { status: 400 });
  if (evidenceText.length > 1000)
    return NextResponse.json({ error: "evidence_text too long" }, { status: 400 });
  if (containsProfanity(evidenceText))
    return NextResponse.json({ error: "Evidence contains disallowed content." }, { status: 400 });

  // Normalize answers to [{q, a}] of bounded size.
  let answers: Answer[] = [];
  if (Array.isArray(rawAnswers)) {
    answers = rawAnswers
      .slice(0, 3)
      .filter((x): x is Answer => !!x && typeof x === "object")
      .map((x) => ({
        q: typeof (x as Answer).q === "string" ? (x as Answer).q.slice(0, 140) : "",
        a: typeof (x as Answer).a === "string" ? (x as Answer).a.slice(0, 280) : "",
      }))
      .filter((x) => x.q && x.a);
  }
  if (answers.some((a) => containsProfanity(a.a))) {
    return NextResponse.json({ error: "Answer contains disallowed content." }, { status: 400 });
  }

  const { data: item } = await supabase
    .from("items")
    .select("id, user_id, status, type, auto_hidden")
    .eq("id", itemId)
    .single();

  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  if (item.user_id === user.id)
    return NextResponse.json({ error: "Cannot claim your own item" }, { status: 400 });
  if (item.type !== "found")
    return NextResponse.json(
      { error: "Claims are only supported for found items. Use messaging instead." },
      { status: 400 }
    );
  if (item.status !== "active")
    return NextResponse.json({ error: "Item is no longer claimable" }, { status: 400 });

  const { data: claim, error } = await supabase
    .from("claims")
    .insert({
      item_id: itemId,
      claimant_id: user.id,
      answers,
      evidence_text: evidenceText || null,
      evidence_image_url: evidenceImageUrl || null,
    })
    .select()
    .single();

  if (error) {
    // 23505 = unique_violation on claims_open_unique (already has pending/approved).
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json(
        { error: "You already have an open claim on this item." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(claim, { status: 201 });
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get("item");

  // RLS already filters to claimant-mine + owner-of-item + admin.
  let q = supabase.from("claims").select("*").order("created_at", { ascending: false }).limit(50);
  if (itemId) q = q.eq("item_id", itemId);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
