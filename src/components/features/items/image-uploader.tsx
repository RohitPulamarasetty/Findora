"use client";

import { useCallback, useRef } from "react";
import { ImagePlus, X, AlertCircle } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { validateImageFile } from "@/lib/file-validation";
import { MAX_ITEM_IMAGES } from "@/lib/constants";

interface ImageUploaderProps {
  maxFiles?: number;
  value: File[];
  onChange: (files: File[]) => void;
  error?: string;
}

export function ImageUploader({
  maxFiles = MAX_ITEM_IMAGES,
  value,
  onChange,
  error,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (incoming: FileList | null) => {
      if (!incoming) return;
      const valid: File[] = [];
      const remaining = maxFiles - value.length;
      Array.from(incoming)
        .slice(0, remaining)
        .forEach((file) => {
          if (validateImageFile(file).valid) valid.push(file);
        });
      if (valid.length > 0) onChange([...value, ...valid]);
    },
    [value, onChange, maxFiles]
  );

  function removeFile(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function openFilePicker() {
    inputRef.current?.click();
  }

  const canAddMore = value.length < maxFiles;

  return (
    <div className="space-y-3">
      {canAddMore && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload images — click or drag and drop"
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
          onDragOver={(e) => e.preventDefault()}
          onClick={openFilePicker}
          onKeyDown={(e) => {
            // FIX: Prevent this keydown from propagating to the parent <form>,
            // which could trigger native Enter-key form submission.
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              openFilePicker();
            }
          }}
          className={cn(
            "flex min-h-[110px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors duration-150",
            error
              ? "border-red-400 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
              : "border-border-default bg-bg-subtle hover:border-brand-500/60 hover:bg-brand-50/50 dark:hover:border-brand-500/50 dark:hover:bg-brand-900/10"
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg-base shadow-sm">
            <ImagePlus size={20} className="text-text-muted-fg" aria-hidden="true" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-text-secondary">
              Drop photos here or{" "}
              <span className="text-brand-500 underline-offset-2 hover:underline">browse</span>
            </p>
            <p className="mt-0.5 text-[11px] text-text-muted-fg">
              JPEG, PNG or WebP · max 5 MB each · {value.length}/{maxFiles}
            </p>
          </div>
          {/* Hidden file input — outside interactive event path */}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            tabIndex={-1}
            className="sr-only"
            onChange={(e) => {
              handleFiles(e.target.files);
              // Reset so the same file can be re-selected
              e.target.value = "";
            }}
          />
        </div>
      )}

      {error && (
        <p className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
          <AlertCircle size={12} aria-hidden="true" />
          {error}
        </p>
      )}

      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((file, i) => {
            const url = URL.createObjectURL(file);
            return (
              <div key={i} className="group relative aspect-square overflow-hidden rounded-lg">
                <Image
                  src={url}
                  alt={`Preview ${i + 1}`}
                  fill
                  className="object-cover"
                  onLoad={() => URL.revokeObjectURL(url)}
                />
                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  aria-label={`Remove photo ${i + 1}`}
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X size={11} strokeWidth={2.5} />
                </button>
                <div className="absolute bottom-1 left-1.5 rounded bg-black/50 px-1 py-0.5 text-[9px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {i + 1}/{maxFiles}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
