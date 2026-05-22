/**
 * Cron: transition long-unresolved `active` items to `closed`.
 *
 * Schedule: daily at 04:00 UTC (see vercel.json).
 *
 * Rule: an item that has been `active` for > 60 days with no completed
 * resolution is moved to `closed` with a resolution_note so the public
 * feed stops surfacing stale posts. Conversations remain intact for
 * historical reference.
 *
 * Authentication:
 *   - Vercel cron sends `Authorization: Bearer ${CRON_SECRET}` when the
 *     env var is set. We refuse the request without it.
 *   - The route is also safe to call manually from a trusted shell:
 *       curl -H "Authorization: Bearer $CRON_SECRET" \
 *            https://findora.live/api/cron/expire-items
 *
 * Idempotency: re-running the same day is a no-op (the query filters
 * out already-non-active items).
 */
import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/admin";
import { captureException, logInfo } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STALE_DAYS = 60;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // fail closed in prod
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const db = createServiceRoleClient();

  try {
    const { data, error } = await db
      .from("items")
      .update({
        status: "closed",
        resolved_at: new Date().toISOString(),
        resolution_note: `Auto-closed after ${STALE_DAYS} days without resolution.`,
      })
      .eq("status", "active")
      .lt("created_at", cutoff)
      .select("id");

    if (error) throw new Error(error.message);

    const closed = data?.length ?? 0;
    logInfo("cron_expire_items_done", { closed, cutoff });
    return NextResponse.json({ ok: true, closed });
  } catch (err) {
    captureException(err, { event: "cron_expire_items_failed" });
    return NextResponse.json({ error: "Job failed" }, { status: 500 });
  }
}
