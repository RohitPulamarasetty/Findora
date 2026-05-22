/**
 * Owner decides a pending claim.
 *
 *   POST /api/claims/[id]/decide { decision: 'approve' | 'reject', response?: string }
 *
 * Decision columns on `claims` are locked from client roles by 0015's
 * column-level REVOKE — the actual write goes through service-role here,
 * after we've verified the actor is the item's owner. Writes an audit log
 * row for every decision.
 *
 * After a decision lands, we bootstrap a real conversation hand-off:
 *   - find or create the conversation between the item-owner (decider) and
 *     the claimant for this item
 *   - insert a NORMAL user message from the decider explaining the outcome
 *     (sender_id = decider, is_system = false). This is intentional — the
 *     decision shouldn't feel like an automated notification, it should
 *     read as the first message of a real human conversation. The bubble
 *     renders through the standard outgoing/incoming UI, the trigger bumps
 *     unread for the claimant, and realtime delivers it like any other chat.
 *   - return the conversation_id so the decider's client can jump straight
 *     into the chat; the claimant picks it up via the existing realtime
 *     conversations subscription.
 *
 * The conversation insert is idempotent: we look up an existing row by
 * (item_id, owner_id, finder_id) before inserting. The 0004 unique
 * constraint on those three columns guarantees we never end up with
 * duplicate conversations.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { containsProfanity } from "@/lib/profanity";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const APPROVE_MESSAGE =
  "I reviewed your answers and believe this item may be yours. How would you like to coordinate the handover?";
const REJECT_MESSAGE =
  "I reviewed your answers but I’m not fully sure this item is yours yet. If you’re confident it belongs to you, please share more details here.";

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(request, "messaging", { userId: user.id });
  if (!rl.allowed) return rl.response!;

  const body = await request.json().catch(() => ({}));
  const decision = body.decision === "approve" || body.decision === "reject" ? body.decision : null;
  const ownerResponse = typeof body.response === "string" ? body.response.trim().slice(0, 500) : "";

  if (!decision)
    return NextResponse.json({ error: "decision must be 'approve' or 'reject'" }, { status: 400 });
  if (ownerResponse && containsProfanity(ownerResponse))
    return NextResponse.json({ error: "Response contains disallowed content." }, { status: 400 });

  // Verify this user owns the item the claim is against.
  const { data: claim } = await supabase
    .from("claims")
    .select("id, item_id, status, claimant_id")
    .eq("id", id)
    .single();

  if (!claim) return NextResponse.json({ error: "Claim not found" }, { status: 404 });
  if (claim.status !== "pending")
    return NextResponse.json({ error: "Claim already decided." }, { status: 409 });

  const { data: item } = await supabase
    .from("items")
    .select("user_id, status")
    .eq("id", claim.item_id)
    .single();
  if (!item || item.user_id !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // Block decisions on items that have already been removed / completed /
  // closed. Without this guard, the post-decision conversation bootstrap
  // below would create a brand-new conversation that the 0016 trigger
  // would then immediately lock — confusing UX and a wasted row.
  if (item.status !== "active")
    return NextResponse.json(
      { error: "This item is no longer active — claims can no longer be decided." },
      { status: 409 }
    );

  const admin_db = createServiceRoleClient();
  const newStatus = decision === "approve" ? "approved" : "rejected";
  const nowIso = new Date().toISOString();

  // Atomic CAS — the `.eq("status", "pending")` predicate is evaluated by
  // Postgres inside the UPDATE, so two concurrent requests can never both
  // succeed. `.select("id")` returns the rows that were actually written,
  // letting us distinguish "I won the race" from "already decided" without
  // a second round-trip. Replaces the earlier read-then-write pattern that
  // had a TOCTOU race between the status check above and this update.
  const { data: updated, error: updErr } = await admin_db
    .from("claims")
    .update({
      status: newStatus,
      decided_at: nowIso,
      decided_by: user.id,
      owner_response: ownerResponse || null,
    })
    .eq("id", id)
    .eq("status", "pending")
    .select("id");

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
  if (!updated || updated.length === 0) {
    // Another request decided this claim between our read at line 65 and
    // this update. Surface the same 409 the pre-check would have returned.
    return NextResponse.json({ error: "Claim already decided." }, { status: 409 });
  }

  // Audit log — only reached when this request is the one that flipped the
  // row, so we never write duplicate audit entries for the same decision.
  await admin_db.from("admin_audit_log").insert({
    actor_id: user.id,
    action: `claim.${decision}`,
    target_table: "claims",
    target_id: id,
    payload: { item_id: claim.item_id, claimant_id: claim.claimant_id },
  });

  // ── Bootstrap the post-decision conversation ────────────────────────────
  // Reuse the (item_id, owner_id, finder_id) conversation if it already
  // exists; the table's unique constraint guarantees at most one.
  let conversationId: string | null = null;
  try {
    const { data: existingConvo } = await admin_db
      .from("conversations")
      .select("id")
      .eq("item_id", claim.item_id)
      .eq("owner_id", user.id)
      .eq("finder_id", claim.claimant_id)
      .maybeSingle();

    if (existingConvo) {
      conversationId = existingConvo.id;
    } else {
      const { data: newConvo, error: convoErr } = await admin_db
        .from("conversations")
        .insert({
          item_id: claim.item_id,
          owner_id: user.id,
          finder_id: claim.claimant_id,
          claim_id: id,
        } as never)
        .select("id")
        .single();
      if (!convoErr && newConvo) conversationId = newConvo.id;
    }

    // Insert as a NORMAL user message from the decider. is_system stays
    // false and sender_id is the decider (= conversation.owner_id), so:
    //   - the bubble renders through the standard outgoing UI for the
    //     decider and incoming UI for the claimant,
    //   - the 0007 handle_new_message trigger correctly increments
    //     unread_finder (the claimant's side),
    //   - realtime subscribers on messages get the row like any other chat,
    //   - read receipts behave like any normal message.
    //
    // We still write via the service-role client because the conversation
    // we just inserted may not be visible to RLS within this same request
    // (the RLS "Participants can send messages" check + the locked-check
    // race for a freshly-created conversation are simpler to sidestep here
    // than to weaken). Service role is safe — the decider's ownership of
    // the underlying item was already verified above.
    if (conversationId) {
      await admin_db.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: decision === "approve" ? APPROVE_MESSAGE : REJECT_MESSAGE,
        is_system: false,
      });
    }
  } catch {
    // Conversation bootstrap is non-fatal — the decision itself already
    // landed and was audited. Client falls back to a no-redirect outcome.
    conversationId = null;
  }

  return NextResponse.json({ ok: true, status: newStatus, conversation_id: conversationId });
}
