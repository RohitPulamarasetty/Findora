"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight, Check, Loader2, Upload, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { BasicInfoStep } from "./report-form-steps/basic-info-step";
import { DetailsStep } from "./report-form-steps/details-step";
import { ImagesStep } from "./report-form-steps/images-step";
import { useCreateItem } from "@/hooks/use-create-item";
import { createItemSchema, type CreateItemInput } from "@/lib/validations";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Basics", description: "Type, title & category" },
  { label: "Details", description: "Description, location & date" },
  { label: "Photos", description: "Optional images" },
];

interface ReportFormProps {
  type?: "lost" | "found";
  onSuccess?: (itemId: string) => void;
}

export function ReportForm({ type = "lost", onSuccess }: ReportFormProps) {
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  // Terminal success state — once true, the form is permanently locked.
  // Drives the disabled attribute and the "Redirecting…" label so the button
  // never re-enables during the async Next.js route transition.
  const [isCompleted, setIsCompleted] = useState(false);
  const router = useRouter();
  const { mutateAsync: createItem, isPending } = useCreateItem();

  // Synchronous submit lock — set before any awaits so rapid tap/click or
  // Enter-key spam cannot queue a second request before React re-renders.
  const submittingRef = useRef(false);

  // Permanent completion guard — survives React rerenders, slow navigation,
  // and any timing gap between setState and the next render frame. This is the
  // source-of-truth check; isCompleted is only for rendering.
  const completedRef = useRef(false);

  const form = useForm<CreateItemInput>({
    resolver: zodResolver(createItemSchema),
    defaultValues: {
      type,
      title: "",
      category: "",
      description: "",
      location: "",
      date_occurred: new Date().toISOString().split("T")[0],
      verification_questions: [],
    },
  });

  async function validateStep(current: number): Promise<boolean> {
    if (current === 0) return form.trigger(["type", "title", "category"]);
    if (current === 1) return form.trigger(["description", "location", "date_occurred"]);
    return true;
  }

  async function handleNext() {
    const valid = await validateStep(step);
    if (valid) setStep((s) => s + 1);
  }

  function onInvalid(errors: FieldErrors<CreateItemInput>) {
    const fields = Object.keys(errors);
    const step0Fields = ["type", "title", "category"];
    const step1Fields = ["description", "location", "date_occurred", "verification_questions"];
    if (fields.some((f) => step0Fields.includes(f))) {
      setStep(0);
    } else if (fields.some((f) => step1Fields.includes(f))) {
      setStep(1);
    }
    toast.error("Please fix the highlighted fields before submitting.");
  }

  async function handleSubmit(values: CreateItemInput) {
    // Hard guards — completedRef fires synchronously before any re-render, and
    // blocks every path: Enter-key spam, rapid taps, back-button re-submit,
    // and any timing gap during the async Next.js route transition.
    if (completedRef.current || submittingRef.current || isPending || isUploading) return;
    submittingRef.current = true;
    setUploadErrors([]);

    let item: Awaited<ReturnType<typeof createItem>>;
    try {
      item = await createItem(values);
    } catch {
      // useCreateItem's onError already shows a toast.
      // Release the in-flight lock so the user can retry — but completedRef
      // stays false (creation genuinely failed, no duplicate risk).
      submittingRef.current = false;
      return;
    }

    // ── Item row created successfully ─────────────────────────────────────
    // Lock permanently NOW — before image uploads, before navigation.
    // DO NOT reset completedRef or submittingRef from this point forward.
    // This guarantees exactly-once submission even if navigation is slow,
    // the component re-renders, or the user spam-clicks during the redirect.
    completedRef.current = true;
    setIsCompleted(true);

    if (files.length > 0) {
      setIsUploading(true);
      setUploadProgress(0);
      let uploaded = 0;
      const errors: string[] = [];

      await Promise.allSettled(
        files.map(async (file) => {
          try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch(`/api/items/${item.id}/images`, {
              method: "POST",
              body: formData,
            });

            if (!res.ok) {
              const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
              const msg = body?.error ?? `Upload failed (${res.status})`;
              errors.push(`${file.name}: ${msg}`);
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Network error";
            errors.push(`${file.name}: ${msg}`);
          } finally {
            uploaded++;
            setUploadProgress(Math.round((uploaded / files.length) * 100));
          }
        })
      );

      setIsUploading(false);

      if (errors.length > 0) {
        setUploadErrors(errors);
        toast.error(
          errors.length === files.length
            ? "Photos failed to upload. The report was saved without images."
            : `${errors.length} photo(s) failed to upload.`,
          { duration: 6000 }
        );
      }
    }

    // Navigate — form is already permanently locked above, so even if
    // router.push takes multiple seconds the button cannot be re-clicked.
    if (onSuccess) {
      onSuccess(item.id);
    } else {
      router.push(`/items/${item.id}`);
    }
  }

  // ─── Prevent Enter-key form submission everywhere except Textarea ───────────
  function handleFormKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
      e.preventDefault();
    }
  }

  const isSubmitting = isPending || isUploading;
  // isLocked is the single source-of-truth for the disabled state.
  // It is true the moment the item row is created and stays true forever —
  // even after isPending/isUploading both return to false during navigation.
  const isLocked = isCompleted || isSubmitting;
  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="mx-auto w-full max-w-xl">
      {/* ─── Stepper ─────────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center">
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div key={i} className="flex flex-1 items-center">
              {/* Step circle */}
              <button
                type="button"
                onClick={() => done && setStep(i)}
                disabled={!done}
                aria-label={`Step ${i + 1}: ${s.label}`}
                className={cn(
                  "relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-200",
                  done
                    ? "cursor-pointer bg-brand-500 text-white hover:bg-brand-600"
                    : active
                      ? "border-2 border-brand-500 bg-bg-base text-brand-500"
                      : "border-2 border-border-default bg-bg-base text-text-muted-fg"
                )}
              >
                {done ? <Check size={12} strokeWidth={3} /> : i + 1}
              </button>

              {/* Label — visible on sm+ */}
              <div className="ml-1.5 hidden sm:block">
                <p
                  className={cn(
                    "text-[11px] font-semibold leading-none",
                    active ? "text-text-base" : done ? "text-brand-500" : "text-text-muted-fg"
                  )}
                >
                  {s.label}
                </p>
              </div>

              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="mx-2 h-px flex-1 transition-colors duration-200 sm:ml-2">
                  <div
                    className={cn(
                      "h-px w-full transition-all duration-300",
                      done ? "bg-brand-500" : "bg-border-default"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── Step label (mobile) ──────────────────────────────────────── */}
      <div className="mb-5 sm:hidden">
        <p className="text-xs font-semibold text-text-base">
          Step {step + 1} of {STEPS.length} — {STEPS[step].label}
        </p>
        <p className="text-[11px] text-text-muted-fg">{STEPS[step].description}</p>
      </div>

      {/* ─── Form ────────────────────────────────────────────────────── */}
      <Form {...form}>
        {/*
         * FIX: onKeyDown prevents Enter key from triggering native form submission.
         * This is the primary guard against auto-submit.
         */}
        <form
          onSubmit={form.handleSubmit(handleSubmit, onInvalid)}
          onKeyDown={handleFormKeyDown}
          noValidate
          className="space-y-5"
        >
          {/* Step content — keyed so React fully unmounts/remounts between steps */}
          <div key={`step-${step}`} className="animate-fade-in">
            {step === 0 && <BasicInfoStep form={form} />}
            {step === 1 && <DetailsStep form={form} />}
            {step === 2 && <ImagesStep files={files} onChange={setFiles} />}
          </div>

          {/* Upload progress */}
          {isUploading && (
            <div className="space-y-1.5 rounded-xl border border-border-default bg-bg-subtle p-3">
              <div className="flex items-center gap-2">
                <Upload size={13} className="animate-bounce text-brand-500" />
                <p className="text-xs font-medium text-text-base">
                  Uploading photos… {uploadProgress}%
                </p>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-border-default">
                <div
                  className="h-1.5 rounded-full bg-brand-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload errors */}
          {uploadErrors.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900/40 dark:bg-red-950/20">
              <div className="mb-1.5 flex items-center gap-1.5">
                <AlertCircle size={13} className="text-red-500" />
                <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                  Some photos failed to upload
                </p>
              </div>
              <ul className="space-y-0.5">
                {uploadErrors.map((err, i) => (
                  <li key={i} className="text-[11px] text-red-500/80 dark:text-red-400/70">
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ─── Navigation buttons ────────────────────────────────────
           * FIX: Use distinct `key` props so React unmounts the "Next" button
           * and mounts a fresh "Submit" button rather than patching the type
           * attribute on the same DOM node. Patching type="button"→"submit"
           * on an active/focused button caused browsers to fire a submit event.
           */}
          <div className="flex items-center gap-2.5 pt-1">
            {step > 0 && (
              <Button
                key="back-btn"
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep((s) => s - 1)}
                className="h-10 gap-1 px-3"
              >
                <ChevronLeft size={15} />
                Back
              </Button>
            )}

            <div className="flex-1" />

            {!isLastStep ? (
              <Button
                key="next-btn"
                type="button"
                size="sm"
                onClick={handleNext}
                className="h-10 gap-1 px-5"
              >
                Continue
                <ChevronRight size={15} />
              </Button>
            ) : (
              <Button
                key="submit-btn"
                type="submit"
                size="sm"
                disabled={isLocked}
                className="h-10 gap-2 px-5"
              >
                {isLocked ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} strokeWidth={2.5} />
                )}
                {isPending
                  ? "Submitting…"
                  : isUploading
                    ? "Uploading…"
                    : isCompleted
                      ? "Redirecting…"
                      : "Submit Report"}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
