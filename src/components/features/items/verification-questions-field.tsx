"use client";

/**
 * Optional verification-questions input, rendered inside the report form's
 * Details step. Lets the owner of a *lost* item set up to 3 short questions
 * that a future claimant must answer.
 *
 * UX:
 *   - Hidden behind a collapsible disclosure (default closed) — does not
 *     pollute the form for users who don't need it.
 *   - Up to 3 inputs; each capped at 140 chars (matches DB trigger + Zod).
 *   - "Add another question" button appears until the cap is hit.
 *   - Mobile-first: full-width inputs, 16px font (avoids iOS zoom).
 *
 * Accessibility:
 *   - Each input has an associated <label> with a stable id.
 *   - Remove buttons have explicit `aria-label`.
 *   - Disclosure uses <details>/<summary> for native keyboard a11y.
 */
import { useId, useState } from "react";
import { Plus, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerificationQuestionsFieldProps {
  value: string[];
  onChange: (next: string[]) => void;
}

const MAX_QUESTIONS = 3;
const MAX_LEN = 140;

const inputClass =
  "w-full rounded-xl border border-border-default bg-bg-base px-3.5 py-2.5 text-[15px] text-text-base placeholder:text-text-muted-fg transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

export function VerificationQuestionsField({ value, onChange }: VerificationQuestionsFieldProps) {
  const baseId = useId();
  const [open, setOpen] = useState(value.length > 0);

  function updateAt(index: number, next: string) {
    const copy = [...value];
    copy[index] = next.slice(0, MAX_LEN);
    onChange(copy);
  }

  function addOne() {
    if (value.length >= MAX_QUESTIONS) return;
    onChange([...value, ""]);
  }

  function removeAt(index: number) {
    const copy = value.filter((_, i) => i !== index);
    onChange(copy);
  }

  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      className="group rounded-2xl border border-border-default bg-bg-subtle"
    >
      <summary
        className={cn(
          "flex cursor-pointer list-none items-start gap-3 px-4 py-3.5",
          "rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 dark:bg-brand-500/15">
          <ShieldCheck size={14} className="text-brand-600 dark:text-brand-400" />
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-text-base">
            Verification questions{" "}
            <span className="font-normal text-text-muted-fg">(optional)</span>
          </p>
          <p className="mt-0.5 text-[11.5px] leading-snug text-text-muted-fg">
            Ask up to {MAX_QUESTIONS} short questions only the real owner can answer (e.g. brand,
            color, what was inside).
          </p>
        </div>
        <span
          aria-hidden="true"
          className="mt-1 text-[18px] leading-none text-text-muted-fg transition-transform group-open:rotate-45"
        >
          +
        </span>
      </summary>

      <div className="space-y-3 px-4 pb-4 pt-1">
        {value.length === 0 && (
          <button
            type="button"
            onClick={addOne}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border-default px-3.5 py-2.5 text-[13px] font-medium text-text-muted-fg transition-colors hover:border-brand-500/40 hover:text-text-base"
          >
            <Plus size={14} aria-hidden="true" />
            Add a question
          </button>
        )}

        {value.map((q, i) => {
          const inputId = `${baseId}-q-${i}`;
          return (
            <div key={i} className="space-y-1">
              <label
                htmlFor={inputId}
                className="flex items-baseline justify-between text-[11px] font-semibold uppercase tracking-wide text-text-muted-fg"
              >
                <span>Question {i + 1}</span>
                <span className="font-normal normal-case tracking-normal opacity-70">
                  {q.length}/{MAX_LEN}
                </span>
              </label>
              <div className="flex gap-2">
                <input
                  id={inputId}
                  value={q}
                  onChange={(e) => updateAt(i, e.target.value)}
                  onBlur={() => {
                    if (!q.trim()) removeAt(i);
                  }}
                  maxLength={MAX_LEN}
                  placeholder="e.g. What brand is it?"
                  autoComplete="off"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  aria-label={`Remove question ${i + 1}`}
                  className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-border-default bg-bg-base text-text-muted-fg transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          );
        })}

        {value.length > 0 && value.length < MAX_QUESTIONS && (
          <button
            type="button"
            onClick={addOne}
            className="flex items-center gap-1.5 text-[12.5px] font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400"
          >
            <Plus size={13} aria-hidden="true" />
            Add another question
          </button>
        )}
      </div>
    </details>
  );
}
