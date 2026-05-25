/**
 * Analytics utility — thin wrapper around GA4's gtag() for custom event
 * tracking. All calls are no-ops until the GA4 script loads (or if the
 * user has blocked analytics), so it is safe to call unconditionally.
 *
 * Usage:
 *   import { trackEvent } from "@/lib/analytics";
 *   trackEvent("lost_item_submitted", { category: "Electronics" });
 */

// Extend the Window type so TypeScript knows about gtag without a
// separate @types package. The function is injected by GA4's script.
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// ── Event name catalogue ──────────────────────────────────────────────────────
// Extend this union as new product events are added. Keeping it as a
// discriminated union prevents typos at call sites.
export type FindoraEventName =
  | "lost_item_submitted"
  | "found_item_submitted"
  | "match_opened"
  | "contact_initiated";

// Optional dimensions / metrics that can accompany any event.
export interface EventParams {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Send a custom GA4 event.
 *
 * - Only fires on the client (guards against SSR/Edge execution).
 * - Silently no-ops if gtag hasn't loaded yet (script blocked / slow network).
 */
export function trackEvent(name: FindoraEventName, params?: EventParams): void {
  if (typeof window === "undefined") return;
  window.gtag?.("event", name, params);
}

// ── Convenience helpers ───────────────────────────────────────────────────────
// Pre-typed helpers make call sites self-documenting.

export const Analytics = {
  lostItemSubmitted: (params?: EventParams) => trackEvent("lost_item_submitted", params),
  foundItemSubmitted: (params?: EventParams) => trackEvent("found_item_submitted", params),
  matchOpened: (params?: EventParams) => trackEvent("match_opened", params),
  contactInitiated: (params?: EventParams) => trackEvent("contact_initiated", params),
};
