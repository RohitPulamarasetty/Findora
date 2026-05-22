/**
 * Liveness + dependency-readiness probe.
 *
 * GET /api/health
 *   - 200 with { status: "ok", checks: {...} } when all hard deps are up.
 *   - 503 with { status: "degraded", checks: {...} } when any check fails.
 *
 * Hard deps:
 *   - Supabase (cheap RPC-style ping: `select 1` via a known table count)
 *   - Upstash (optional — only checked if env vars are present)
 *
 * Designed to be hit by external uptime monitors (UptimeRobot, BetterStack,
 * etc.) at 1-min cadence. Each check has a tight per-call timeout so a
 * dependency outage doesn't tie up our function for 30s.
 *
 * NOT authenticated — intentional. No sensitive data is returned.
 */
import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIMEOUT_MS = 3000;

interface CheckResult {
  ok: boolean;
  latencyMs: number;
  error?: string;
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

async function checkSupabase(): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    const sb = createServiceRoleClient();
    // count: 'exact', head: true is a cheap pure-metadata query.
    // Wrap in Promise.resolve so withTimeout's generic narrows correctly
    // (PostgrestFilterBuilder is thenable but not strictly a Promise<unknown>).
    const result = await withTimeout(
      Promise.resolve(sb.from("users").select("id", { count: "exact", head: true }).limit(1)),
      TIMEOUT_MS
    );
    if (result.error) throw new Error(result.error.message);
    return { ok: true, latencyMs: Date.now() - t0 };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - t0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function checkUpstash(): Promise<CheckResult | null> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null; // optional dep — skip
  }
  const t0 = Date.now();
  try {
    const resp = await withTimeout(
      fetch(`${process.env.UPSTASH_REDIS_REST_URL}/ping`, {
        headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
        cache: "no-store",
      }),
      TIMEOUT_MS
    );
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return { ok: true, latencyMs: Date.now() - t0 };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - t0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function GET() {
  const [supabase, upstash] = await Promise.all([checkSupabase(), checkUpstash()]);

  const checks: Record<string, CheckResult | "skipped"> = {
    supabase,
    upstash: upstash ?? "skipped",
  };

  const allOk = supabase.ok && (upstash === null || upstash.ok);

  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
      env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
      checks,
    },
    {
      status: allOk ? 200 : 503,
      headers: { "Cache-Control": "no-store, max-age=0" },
    }
  );
}
