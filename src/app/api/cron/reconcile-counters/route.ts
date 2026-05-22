/**
 * Cron: reconcile cached counters against ground truth.
 *
 * Schedule: weekly Sunday 03:00 UTC (see vercel.json).
 *
 * Why: `flag_count` (items) and `unread_owner`/`unread_finder`
 * (conversations) are maintained by triggers and route handlers. Over
 * time they drift (rollbacks, manual fixes, partial failures). A weekly
 * reconciliation against the source-of-truth tables keeps them honest
 * without forcing real-time consistency checks on the hot path.
 *
 * Strategy: SQL aggregates inside a single PostgREST batch. No
 * row-by-row loops. Read-modify-write happens server-side via Supabase.
 *
 * Authentication: same shared-secret pattern as the other crons.
 */
import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/admin";
import { captureException, logInfo } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createServiceRoleClient();
  const summary: Record<string, number | string> = {};

  try {
    // 1. Reconcile items.flag_count from public.flags.
    //    Uses a single statement RPC-style update with a correlated
    //    subquery. PostgREST exposes this via `.rpc()` if you define a
    //    SQL function — for now we issue it via the lightweight
    //    `from('items').update(...)` pattern, which still ships a single
    //    SQL statement to Postgres.
    const { data: flagFixes, error: flagErr } = await db.rpc("reconcile_item_flag_counts" as never);
    if (flagErr) {
      // Function not deployed yet — log and continue. This makes the
      // cron useful even before the optional SQL function is applied.
      summary.flag_counts_skipped = flagErr.message;
    } else {
      summary.flag_counts_updated = (flagFixes as unknown as number) ?? 0;
    }

    // 2. Reconcile conversations.unread_* from public.messages.
    const { data: unreadFixes, error: unreadErr } = await db.rpc(
      "reconcile_conversation_unread" as never
    );
    if (unreadErr) {
      summary.unread_counts_skipped = unreadErr.message;
    } else {
      summary.unread_counts_updated = (unreadFixes as unknown as number) ?? 0;
    }

    logInfo("cron_reconcile_done", summary);
    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    captureException(err, { event: "cron_reconcile_failed" });
    return NextResponse.json({ error: "Job failed" }, { status: 500 });
  }
}
