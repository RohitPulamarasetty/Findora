"use client";

/**
 * ClaimSheet — modal sheet for submitting an ownership claim against a
 * found item.
 *
 * Used from <ItemDetail /> when the viewer is NOT the owner AND
 * item.type === "found" AND item.status === "active". The finder set the
 * verification questions at report time; the claimant answers them here so
 * the finder can review and approve/reject the claim. The existing
 * messaging flow stays available for clarifying questions.
 *
 * UX:
 *   - Mobile-first sheet: full-width on small screens, max 540px on md+.
 *   - Renders the owner's verification questions (if any) as required
 *     answer inputs.
 *   - Optional free-text evidence (≤1000 chars).
 *   - Submit → POST /api/claims. 409 = duplicate; 4xx surfaces as toast.
 *   - On success: closes sheet + toast + invalidate item-detail query so
 *     the claim shows up in the owner-side review section.
 *
 * Image evidence is NOT supported in Sprint 1 (would require a new storage
 * bucket + policies). Documented in Known Limitations.
 */
import { useEffect, useRef, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { queryKeys } from "@/lib/query-keys";

interface ClaimSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemTitle: string;
  verificationQuestions: string[];
}

const inputClass =
  "w-full rounded-xl border border-border-default bg-bg-base px-3.5 py-2.5 text-[15px] text-text-base placeholder:text-text-muted-fg transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

export function ClaimSheet({
  open,
  onOpenChange,
  itemId,
  itemTitle,
  verificationQuestions,
}: ClaimSheetProps) {
  const [answers, setAnswers] = useState<string[]>(() => verificationQuestions.map(() => ""));
  const [evidence, setEvidence] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();
  // Synchronous lock — set before any awaits so rapid taps / Enter-key presses
  // cannot enqueue a second request before React paints the disabled state.
  const submittingRef = useRef(false);

  // Reset form whenever the sheet (re)opens with potentially different
  // questions on a new item.
  useEffect(() => {
    if (open) {
      setAnswers(verificationQuestions.map(() => ""));
      setEvidence("");
    }
  }, [open, verificationQuestions]);

  const hasQuestions = verificationQuestions.length > 0;
  const answersComplete = verificationQuestions.every((_, i) => answers[i]?.trim().length > 0);
  const evidenceOk = evidence.trim().length === 0 || evidence.trim().length <= 1000;
  const canSubmit =
    !submitting && (hasQuestions ? answersComplete : evidence.trim().length > 0) && evidenceOk;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Synchronous ref guard prevents duplicate submits before React re-renders.
    // The canSubmit / submitting checks are kept as secondary UI guards.
    if (submittingRef.current || submitting) return;
    if (!canSubmit) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: itemId,
          answers: verificationQuestions.map((q, i) => ({
            q,
            a: answers[i]?.trim() ?? "",
          })),
          evidence_text: evidence.trim() || undefined,
        }),
      });

      if (res.status === 409) {
        toast.info("You already have an open claim on this item.");
        onOpenChange(false);
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body?.error ?? `Failed to submit (${res.status})`);
        return;
      }

      toast.success("Claim submitted — the reporter will review it.");
      void queryClient.invalidateQueries({ queryKey: queryKeys.items.detail(itemId) });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Network error");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[540px]">
        <DialogHeader>
          <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-500/10 dark:bg-brand-500/15">
            <ShieldCheck size={16} className="text-brand-600 dark:text-brand-400" />
          </div>
          <DialogTitle className="text-[17px]">Claim this item</DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed">
            Submit ownership proof for <span className="font-medium">{itemTitle}</span>. The
            reporter will review and respond — usually within a day.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            // Prevent Enter on single-line inputs from triggering form submit —
            // especially important on mobile where the "Go/Done" key fires Enter.
            if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
              e.preventDefault();
            }
          }}
          className="space-y-4 pt-1"
          noValidate
        >
          {hasQuestions ? (
            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted-fg">
                Verification questions
              </p>
              {verificationQuestions.map((q, i) => {
                const id = `claim-answer-${i}`;
                return (
                  <div key={i} className="space-y-1.5">
                    <label htmlFor={id} className="block text-[13px] font-medium text-text-base">
                      {q}
                    </label>
                    <input
                      id={id}
                      value={answers[i] ?? ""}
                      onChange={(e) => {
                        const copy = [...answers];
                        copy[i] = e.target.value.slice(0, 280);
                        setAnswers(copy);
                      }}
                      required
                      maxLength={280}
                      placeholder="Your answer"
                      autoComplete="off"
                      className={inputClass}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl bg-bg-muted-surface px-3.5 py-2.5 text-[12px] leading-relaxed text-text-muted-fg">
              The reporter didn&apos;t set verification questions. Describe how you know this item
              is yours below.
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="claim-evidence"
              className="flex items-baseline justify-between text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted-fg"
            >
              <span>Additional proof {!hasQuestions && <span>(required)</span>}</span>
              <span className="font-normal normal-case tracking-normal opacity-70">
                {evidence.length}/1000
              </span>
            </label>
            <Textarea
              id="claim-evidence"
              value={evidence}
              onChange={(e) => setEvidence(e.target.value.slice(0, 1000))}
              rows={3}
              placeholder="Anything else the owner should know — unique markings, where you found it, etc."
              className="resize-none rounded-xl border-border-default bg-bg-base px-3.5 py-2.5 text-[15px] placeholder:text-text-muted-fg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <DialogFooter className="gap-2 pt-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit || submitting}>
              {submitting && <Loader2 size={14} className="mr-1.5 animate-spin" />}
              {submitting ? "Submitting…" : "Submit claim"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
