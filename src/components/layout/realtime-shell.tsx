"use client";

import { useRealtimeConversations } from "@/hooks/use-realtime-conversations";

/**
 * Mounts the global conversations realtime subscription exactly once at the
 * authenticated app-shell level. Receives the userId from the server layout
 * so the hook can filter events to the correct user without an extra fetch.
 *
 * Lives here rather than in BottomNav or AppLayout itself because:
 *   - AppLayout is a Server Component and cannot call hooks.
 *   - BottomNav doesn't receive userId; patching its props just to wire a
 *     side-effect would couple unrelated concerns.
 *   - A dedicated wrapper keeps the subscription lifecycle explicit and
 *     testable in isolation.
 */
export function RealtimeShell({ userId }: { userId: string }) {
  useRealtimeConversations(userId);
  return null;
}
