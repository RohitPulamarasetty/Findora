import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Production-grade rate limiting backed by Upstash Redis.
 *
 * ── Why Upstash ─────────────────────────────────────────────────────────────
 * Vercel serverless functions don't share memory between invocations, so
 * in-process limiters (Map / LRU) leak per-cold-start and offer no real
 * protection at scale. Upstash provides a serverless-native Redis with a
 * REST transport that works inside Vercel's edge & node runtimes.
 *
 * ── Design ──────────────────────────────────────────────────────────────────
 *   - Sliding window (more even traffic shaping than fixed window).
 *   - Identifier prefers `user:<uid>` when an authenticated user is known,
 *     falling back to `ip:<x-forwarded-for>` for guests / auth endpoints.
 *   - One Redis client is created per Node process (module singleton).
 *   - Buckets are isolated by name so a noisy "search" caller cannot starve
 *     the "payments" bucket.
 *   - `fail-open` policy: if Upstash env vars are missing (e.g. local dev,
 *     preview deploys), the limiter short-circuits and allows the request.
 *     This is deliberate — we never want a misconfigured Redis to take down
 *     production traffic. Hosted prod must set the env vars (see below).
 *
 * ── Env vars (set in Vercel Project Settings) ──────────────────────────────
 *   UPSTASH_REDIS_REST_URL   = https://<region>-<name>.upstash.io
 *   UPSTASH_REDIS_REST_TOKEN = <token from Upstash dashboard>
 *
 * ── Response shape on 429 ──────────────────────────────────────────────────
 *   { error: "Too many requests. Please slow down.",
 *     code:  "rate_limited",
 *     bucket: "<name>",
 *     retryAfterSeconds: <int> }
 *   + headers: Retry-After, X-RateLimit-Limit, X-RateLimit-Remaining,
 *              X-RateLimit-Reset
 */

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const isEnabled = Boolean(redisUrl && redisToken);

// Single shared Redis client — Upstash's REST client is stateless / pooled.
const redis = isEnabled
  ? new Redis({ url: redisUrl as string, token: redisToken as string })
  : null;

export type RateLimitBucket =
  | "auth" // OAuth callback, sign-in
  | "items_read" // GET /api/items (search/list) — authenticated users
  | "items_write" // POST /api/items (create), PATCH/DELETE
  | "uploads" // image upload
  | "messaging" // create conversation, send message
  | "payments" // create-order, verify
  | "admin" // any admin route
  | "flags" // user-submitted flag reports
  | "public"; // anything else / fallback

interface BucketConfig {
  /** Token bucket size / max allowed requests in `window`. */
  limit: number;
  /** Sliding-window length, e.g. "1 m" or "10 s". */
  window: `${number} ${"ms" | "s" | "m" | "h" | "d"}`;
}

/**
 * Tuned, conservative production limits. These are intentionally generous
 * for legitimate user traffic and only meant to stop runaway scripts or
 * abusive automation. Tighten if abuse is observed.
 */
const BUCKET_CONFIG: Record<RateLimitBucket, BucketConfig> = {
  auth: { limit: 10, window: "1 m" }, // 10 auth attempts / min / IP
  items_read: { limit: 90, window: "1 m" }, // search/list reads (TanStack Query will burst on filter changes)
  items_write: { limit: 12, window: "1 m" }, // ~ same shape as DB hourly limit but per-minute floor
  uploads: { limit: 20, window: "1 m" }, // 20 image POSTs / min / user (multipart heavy)
  messaging: { limit: 60, window: "1 m" }, // typing-fast chat is fine; 60/min is plenty
  payments: { limit: 6, window: "1 m" }, // strict — donations are rare; abuse is signal
  admin: { limit: 120, window: "1 m" }, // admins can be heavy in moderation flows
  flags: { limit: 8, window: "1 m" }, // strict — flag spam is a moderation cost
  public: { limit: 60, window: "1 m" }, // generic public catch-all
};

/**
 * Lazily-built per-bucket Ratelimit instances. Created on first use so we
 * don't pay the construction cost when the limiter is disabled.
 */
const limiters: Partial<Record<RateLimitBucket, Ratelimit>> = {};

function getLimiter(bucket: RateLimitBucket): Ratelimit | null {
  if (!redis) return null;
  const existing = limiters[bucket];
  if (existing) return existing;
  const { limit, window } = BUCKET_CONFIG[bucket];
  const instance = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    prefix: `rl:findora:${bucket}`,
    analytics: false, // keep Upstash usage cheap on free tier
  });
  limiters[bucket] = instance;
  return instance;
}

/**
 * Build a stable per-caller key. Auth-aware callers should pass `userId`;
 * otherwise we fall back to the first IP in `x-forwarded-for`.
 */
function resolveIdentifier(request: Request, userId?: string | null): string {
  if (userId) return `u:${userId}`;
  const fwd = request.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return `ip:${ip}`;
}

export interface RateLimitOutcome {
  /** True when the caller is under the limit (or limiter disabled). */
  allowed: boolean;
  /** Pre-built 429 response. Only present when `allowed === false`. */
  response?: NextResponse;
  /** Surface useful headers to merge onto a downstream response. */
  headers: Record<string, string>;
}

/**
 * Check a request against `bucket`. Always returns — never throws.
 *
 * Typical usage at the top of a route handler:
 *
 *   const rl = await rateLimit(request, "payments", { userId: user?.id });
 *   if (!rl.allowed) return rl.response!;
 *
 * If the limiter is disabled (no env vars), `allowed` is always true and
 * `headers` is empty — your handler runs unchanged.
 */
export async function rateLimit(
  request: Request,
  bucket: RateLimitBucket,
  opts: { userId?: string | null } = {}
): Promise<RateLimitOutcome> {
  const limiter = getLimiter(bucket);
  if (!limiter) return { allowed: true, headers: {} };

  const identifier = resolveIdentifier(request, opts.userId);

  try {
    const { success, limit, remaining, reset } = await limiter.limit(identifier);

    const resetMs = Math.max(0, reset - Date.now());
    const retryAfter = Math.ceil(resetMs / 1000);

    const headers: Record<string, string> = {
      "X-RateLimit-Limit": String(limit),
      "X-RateLimit-Remaining": String(Math.max(0, remaining)),
      "X-RateLimit-Reset": String(Math.ceil(reset / 1000)),
    };

    if (!success) {
      headers["Retry-After"] = String(Math.max(1, retryAfter));
      const response = NextResponse.json(
        {
          error: "Too many requests. Please slow down.",
          code: "rate_limited",
          bucket,
          retryAfterSeconds: Math.max(1, retryAfter),
        },
        { status: 429, headers }
      );
      return { allowed: false, response, headers };
    }

    return { allowed: true, headers };
  } catch (err) {
    // Fail open: a Redis/network blip must NOT block real users. Log so we
    // notice if it keeps happening.
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        ts: new Date().toISOString(),
        route: "rate-limit",
        level: "error",
        event: "limiter_exception",
        bucket,
        message: err instanceof Error ? err.message : String(err),
      })
    );
    return { allowed: true, headers: {} };
  }
}

/** Whether the limiter is wired (useful for diagnostics / health checks). */
export function isRateLimitEnabled(): boolean {
  return isEnabled;
}
