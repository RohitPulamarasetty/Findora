import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Marks an item as recovered.
 *
 * The status flip is now the ONLY thing this route does. Migration 0016
 * installs an AFTER-UPDATE-OF-status trigger on `items` that:
 *   - locks every unlocked conversation attached to the item, and
 *   - inserts one closure message per newly-locked conversation, authored
 *     by the item owner (so it renders as a normal chat bubble and bumps
 *     unread for the other participant).
 *
 * Centralising the lock at the DB level means every mutation path (this
 * route, admin removal, owner soft-delete, future moderation flows) gets
 * the same behavior automatically. No app-layer fan-out needed.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(request, "items_write", { userId: user.id });
  if (!rl.allowed) return rl.response!;

  const { data: item } = await supabase
    .from("items")
    .select("user_id, status")
    .eq("id", id)
    .single();

  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  // Only the item reporter can resolve a case.
  if (item.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Allow resolution from any open state; block if already resolved/closed.
  if (["completed", "closed", "resolved"].includes(item.status)) {
    return NextResponse.json({ error: "This item is already resolved." }, { status: 400 });
  }

  const nowIso = new Date().toISOString();

  // Atomic CAS: the `.not("status", "in", ...)` predicate is evaluated inside
  // the UPDATE statement by Postgres, so two concurrent requests can never
  // both write `completed`.  If the row was already resolved by a concurrent
  // request between our status check above and this UPDATE, the predicate
  // matches 0 rows and `data` will be null (maybeSingle returns null, not an
  // error, when 0 rows are affected).
  const { data, error } = await supabase
    .from("items")
    .update({
      status: "completed",
      resolved_at: nowIso,
      resolved_by: user.id,
      handover_confirmed: true,
    })
    .eq("id", id)
    .not("status", "in", "(completed,closed,resolved,removed)")
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!data) {
    // Concurrent request already resolved this item — idempotent 409.
    // eslint-disable-next-line no-console
    console.info(
      JSON.stringify({
        ts: new Date().toISOString(),
        route: "items/complete",
        event: "duplicate_complete_blocked",
        item_id: id,
        user_id: user.id,
      })
    );
    return NextResponse.json({ error: "This item is already resolved." }, { status: 409 });
  }

  return NextResponse.json(data);
}
