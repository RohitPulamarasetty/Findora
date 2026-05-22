/**
 * request-dedup — server-side request deduplication for critical mutations.
 *
 * When an identical request arrives within a short window (double-tap, network
 * retry, concurrent tabs), route handlers use this module to:
 *   1. Detect that the same action was already processed successfully.
 *   2. Return the previous response's result directly — exactly one DB write.
 *
 * Backed by Upstash Redis via the same client as the rate-limiter.  Falls open
 * (`isDuplicate: false`) when Redis is unavailable so route logic is never
 * blocked by a Redis outage.  This intentional "fail-open" means a Redis blip
 * at worst allows a duplicate request through — never silently drops a request.
 *
 * Usage pattern:
 *
 *   const key = `dedup:items:create:${userId}:${titleSlug}`;
 *   const hit = await checkDedup<string>(key);
 *   if (hit.isDuplicate) {
 *     log({ event: "duplicate_submit_blocked", ... });
 *     return NextResponse.json({ id: hit.value });
 *   }
 *   // ... create the resource ...
 *   await storeDedup(key, resource.id, 5);   // 5-second TTL
 */
import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

export type DedupResult<T> = { isDuplicate: true; value: T } | { isDuplicate: false };

/**
 * Check whether `key` exists in the dedup store, meaning an identical request
 * recently completed successfully.  Returns `isDuplicate: true` with the stored
 * value when found; `isDuplicate: false` otherwise.
 * Falls open on Redis errors.
 */
export async function checkDedup<T>(key: string): Promise<DedupResult<T>> {
  if (!redis) return { isDuplicate: false };
  try {
    const val = await redis.get<T>(key);
    if (val !== null && val !== undefined) return { isDuplicate: true, value: val };
    return { isDuplicate: false };
  } catch {
    // Redis error → fail open so the request proceeds normally.
    return { isDuplicate: false };
  }
}

/**
 * Store `value` under `key` with a TTL of `ttlSeconds`.  Call this only AFTER
 * the mutation has completed successfully so we never cache partial failures.
 * Falls open on Redis errors — the request already succeeded; don't block the
 * response path on a cache write failure.
 */
export async function storeDedup(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch {
    // Non-fatal — a cache-miss on the next retry is safe.
  }
}
