"use client";

/**
 * useRealtimeClaims — scoped subscription to claims belonging to a single
 * item. Filters on `item_id=eq.<itemId>`, so the only events delivered are
 * for the item whose review section the user is currently looking at.
 *
 * Used by `<ClaimReviewSection />`. Approve/reject lands as an UPDATE on
 * the claims row, INSERT lands when a new claimant submits — both signal
 * "your pending list is stale, reload it". The hook calls the supplied
 * `onChange` callback; the component owns its local state, so we don't
 * touch React Query cache directly (claims aren't currently keyed in the
 * cache by id). Future cache reads can use `queryKeys.claims.forItem`.
 *
 * Callback stored in a ref to keep the channel effect stable.
 */
import { useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";

interface UseRealtimeClaimsOptions {
  /** Fired for any INSERT / UPDATE / DELETE on this item's claims. */
  onChange?: () => void;
}

export function useRealtimeClaims(itemId: string | undefined, options: UseRealtimeClaimsOptions) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!itemId) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`claims:${itemId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "claims",
          filter: `item_id=eq.${itemId}`,
        },
        () => {
          optionsRef.current.onChange?.();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [itemId]);
}
