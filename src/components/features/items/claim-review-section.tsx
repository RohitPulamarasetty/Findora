"use client";

/**
 * ClaimReviewSection — visible only to the item's owner. Lists pending
 * claims with the claimant's trust badge, their answers, and inline
 * Approve / Reject buttons. Decided claims (approved / rejected /
 * withdrawn) are hidden to keep the UI focused.
 *
 * Data:
 *   - Reads claims via GET /api/claims?item=<id>. RLS guarantees only
 *     claims-against-my-items are returned.
 *   - For each claimant we also fetch the public trust profile (recoveries
 *     count → trust level). Trust profile reads use the `user_trust_profiles`
 *     view from mig. 0015 (security_invoker) so RLS still applies.
 *
 * Decision flow: POST /api/claims/[id]/decide { decision: 'approve' | 'reject' }.
 * Server-side ownership check + service-role write + audit log are already
 * implemented; we just trigger and toast.
 *
 * Intentionally simple: no inline conversation creation, no claimant
 * messaging, no bulk actions. Sprint 1 scope.
 */
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useRealtimeClaims } from "@/hooks/use-realtime-claims";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { TrustBadge } from "@/components/shared/trust-badge";
import { queryKeys } from "@/lib/query-keys";

interface ClaimRow {
  id: string;
  item_id: string;
  claimant_id: string;
  status: "pending" | "approved" | "rejected" | "withdrawn";
  answers: { q: string; a: string }[];
  evidence_text: string | null;
  created_at: string;
}

interface ClaimantProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  recoveries_count: number;
}

interface ClaimReviewSectionProps {
  itemId: string;
}

export function ClaimReviewSection({ itemId }: ClaimReviewSectionProps) {
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ClaimantProfile>>({});
  const [pendingDecision, setPendingDecision] = useState<string | null>(null);
  const [, startNavigation] = useTransition();
  const queryClient = useQueryClient();
  const router = useRouter();
  // Synchronous lock so tap-spam or concurrent clicks on Approve/Reject cannot
  // enqueue a second decision before React re-renders with pendingDecision set.
  const pendingDecisionRef = useRef(false);

  // Reloader is extracted so the realtime hook below can re-fire it on
  // INSERT / UPDATE / DELETE events. The cancellation flag is kept inside
  // each invocation so an in-flight load is harmless when the user
  // navigates away mid-fetch.
  const reload = useCallback(
    async (controller: { cancelled: boolean }, opts: { showLoader?: boolean } = {}) => {
      if (opts.showLoader) setLoading(true);
      try {
        const res = await fetch(`/api/claims?item=${itemId}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = (await res.json()) as ClaimRow[];
        const pending = raw.filter((c) => c.status === "pending");

        // Fetch trust profiles in a single call. RLS on `users` already
        // allows authenticated reads of full_name/avatar_url/recoveries_count;
        // we never select sensitive columns (email/is_banned).
        let profileMap: Record<string, ClaimantProfile> = {};
        if (pending.length > 0) {
          const ids = Array.from(new Set(pending.map((c) => c.claimant_id)));
          const supabase = createClient();
          const { data } = await supabase
            .from("users")
            .select("id, full_name, avatar_url, recoveries_count")
            .in("id", ids);
          if (data) {
            profileMap = Object.fromEntries(
              data.map((p) => [
                p.id,
                {
                  id: p.id,
                  full_name: p.full_name ?? "",
                  avatar_url: p.avatar_url ?? null,
                  recoveries_count: p.recoveries_count ?? 0,
                },
              ])
            );
          }
        }
        if (!controller.cancelled) {
          setClaims(pending);
          setProfiles(profileMap);
        }
      } catch {
        if (!controller.cancelled) {
          // Stay silent on the section if claims fetch fails — the rest of
          // the item-detail page must continue to render.
          setClaims([]);
        }
      } finally {
        if (!controller.cancelled && opts.showLoader) setLoading(false);
      }
    },
    [itemId]
  );

  useEffect(() => {
    const controller = { cancelled: false };
    void reload(controller, { showLoader: true });
    return () => {
      controller.cancelled = true;
    };
  }, [reload]);

  // ── Realtime: scoped to this item's claims only.
  // Fires on any INSERT/UPDATE/DELETE in `claims` where `item_id = itemId`.
  // We trigger a background reload (no loading flash, existing rows stay
  // mounted) — pending rows disappear live the moment a decision lands
  // from another tab / device / admin action.
  useRealtimeClaims(itemId, {
    onChange: () => {
      const controller = { cancelled: false };
      void reload(controller, { showLoader: false });
    },
  });

  async function decide(claimId: string, decision: "approve" | "reject") {
    // Synchronous ref guard blocks tap-spam before React re-renders.
    if (pendingDecisionRef.current || pendingDecision) return;
    pendingDecisionRef.current = true;
    setPendingDecision(claimId);
    try {
      const res = await fetch(`/api/claims/${claimId}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        conversation_id?: string | null;
      };
      if (!res.ok) {
        toast.error(body?.error ?? `Failed (${res.status})`);
        return;
      }
      toast.success(
        decision === "approve"
          ? "Claim approved — opening the conversation."
          : "Claim rejected — opening the conversation."
      );
      setClaims((prev) => prev.filter((c) => c.id !== claimId));
      void queryClient.invalidateQueries({ queryKey: queryKeys.items.detail(itemId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations.lists() });
      if (body.conversation_id) {
        // Wrap the redirect in a transition so the in-progress decision
        // toast/UI stays interactive while Next streams the conversation
        // route in the background.
        const target = `/messages/${body.conversation_id}`;
        startNavigation(() => {
          router.push(target);
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Network error");
    } finally {
      pendingDecisionRef.current = false;
      setPendingDecision(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border-default bg-bg-subtle p-4 shadow-card">
        <div className="flex items-center gap-2 text-[12px] text-text-muted-fg">
          <Loader2 size={13} className="animate-spin" aria-hidden="true" />
          Loading claims…
        </div>
      </div>
    );
  }

  if (claims.length === 0) return null;

  return (
    <section
      aria-labelledby="claims-heading"
      className="space-y-3 rounded-2xl border border-border-default bg-bg-subtle p-4 shadow-card"
    >
      <header className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500/10 dark:bg-brand-500/15">
          <ShieldCheck size={14} className="text-brand-600 dark:text-brand-400" />
        </div>
        <div>
          <h2 id="claims-heading" className="text-[13px] font-bold text-text-base">
            Pending claims ({claims.length})
          </h2>
          <p className="text-[11.5px] text-text-muted-fg">
            Review the answers below and approve the real owner.
          </p>
        </div>
      </header>

      <ul className="space-y-3">
        {claims.map((c) => {
          const profile = profiles[c.claimant_id];
          const isPendingThis = pendingDecision === c.id;
          // Lock every action on every row while any decision is in flight
          // so tap-spam on a different row can't fire a parallel mutation.
          const anyPending = pendingDecision !== null;
          return (
            <li
              key={c.id}
              className="space-y-3 rounded-xl border border-border-default bg-bg-base p-3.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <UserAvatar
                    user={
                      profile
                        ? {
                            full_name: profile.full_name,
                            avatar_url: profile.avatar_url,
                          }
                        : { full_name: "Unknown", avatar_url: null }
                    }
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-text-base">
                      {profile?.full_name ?? "Unknown"}
                    </p>
                    <TrustBadge recoveriesCount={profile?.recoveries_count ?? 0} size="sm" />
                  </div>
                </div>
              </div>

              {c.answers.length > 0 && (
                <dl className="space-y-2 rounded-lg bg-bg-subtle p-3">
                  {c.answers.map((a, i) => (
                    <div key={i}>
                      <dt className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-muted-fg">
                        {a.q}
                      </dt>
                      <dd className="mt-0.5 text-[13px] leading-snug text-text-base">
                        {a.a || <span className="italic text-text-muted-fg">—</span>}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              {c.evidence_text && (
                <div className="rounded-lg bg-bg-subtle p-3">
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-muted-fg">
                    Additional proof
                  </p>
                  <p className="mt-0.5 whitespace-pre-line text-[13px] leading-snug text-text-base">
                    {c.evidence_text}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1.5"
                  disabled={anyPending}
                  onClick={() => decide(c.id, "reject")}
                >
                  {isPendingThis ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
                  Reject
                </Button>
                <Button
                  size="sm"
                  className="flex-1 gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-400 hover:to-teal-400"
                  disabled={anyPending}
                  onClick={() => decide(c.id, "approve")}
                >
                  {isPendingThis ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={13} />
                  )}
                  Approve
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
