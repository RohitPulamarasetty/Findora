/**
 * Validate a user-supplied "next" / return-to path. Only accepts relative
 * paths on our own origin. Rejects:
 *   - null / empty
 *   - paths that don't start with "/"
 *   - protocol-relative URLs ("//evil.com")
 *   - backslash tricks ("/\\evil.com")
 *   - paths that try to embed a scheme ("/javascript:alert(1)")
 *
 * Used by the OAuth callback so an attacker can't craft
 *   /login?next=//attacker.tld
 * and bounce signed-in users off-site.
 */
export function safeNextPath(next: string | null | undefined, fallback = "/home"): string {
  if (typeof next !== "string" || next.length === 0) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//")) return fallback;
  if (next.startsWith("/\\")) return fallback;
  if (/^\/[a-z][a-z0-9+.-]*:/i.test(next)) return fallback; // "/javascript:" etc.
  if (next.length > 512) return fallback; // belt + braces
  return next;
}
