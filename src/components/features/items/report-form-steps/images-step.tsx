"use client";

import { ImageUploader } from "@/components/features/items/image-uploader";

interface ImagesStepProps {
  files: File[];
  onChange: (files: File[]) => void;
}

export function ImagesStep({ files, onChange }: ImagesStepProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border-default bg-bg-subtle p-4">
        <div className="mb-3 flex items-start gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-500/10">
            <span className="text-sm" aria-hidden="true">
              📸
            </span>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-text-base">Add photos</p>
            <p className="text-[11px] leading-relaxed text-text-muted-fg">
              Optional — items with photos are recovered{" "}
              <span className="font-medium text-text-secondary">3× faster</span>. Upload up to 5
              images.
            </p>
          </div>
        </div>
        <ImageUploader value={files} onChange={onChange} />
      </div>

      {files.length === 0 && (
        <p className="text-center text-[11px] text-text-muted-fg">
          You can skip photos and submit now, or add them to increase recovery chances.
        </p>
      )}
    </div>
  );
}
