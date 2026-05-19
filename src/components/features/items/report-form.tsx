"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
  const router = useRouter();
  const { mutateAsync: createItem, isPending } = useCreateItem();

  const form = useForm<CreateItemInput>({
    resolver: zodResolver(createItemSchema),
    defaultValues: {
      type,
      title: "",
      category: "",
      description: "",
      location: "",
      date_occurred: new Date().toISOString().split("T")[0],
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

  async function handleSubmit(values: CreateItemInput) {
    setUploadErrors([]);

    const item = await createItem(values);

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
          onSubmit={form.handleSubmit(handleSubmit)}
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
                disabled={isSubmitting}
                className="h-10 gap-2 px-5"
              >
                {isSubmitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} strokeWidth={2.5} />
                )}
                {isSubmitting ? "Submitting…" : "Submit Report"}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
