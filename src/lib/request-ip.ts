/**
 * Extract the caller's IP address from standard proxy headers.
 *
 * Vercel sets `x-forwarded-for` to the real client IP (first value in the
 * comma-separated list when multiple proxies are in the chain). Falls back
 * to `x-real-ip`, then returns null if neither header is present.
 *
 * SECURITY: Never trust these headers for authentication; they are trivially
 * spoofed when the server is reached directly. They are only used here for
 * audit-log enrichment — useful forensics, not access control.
 */
export function getRequestIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip") ?? null;
}
