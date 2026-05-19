"use client";

import type { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import type { CreateItemInput } from "@/lib/validations";

interface DetailsStepProps {
  form: UseFormReturn<CreateItemInput>;
}

const inputClass =
  "w-full rounded-xl border border-border-default bg-bg-base px-3.5 py-2.5 text-sm text-text-base placeholder:text-text-muted-fg transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

export function DetailsStep({ form }: DetailsStepProps) {
  return (
    <div className="space-y-5">
      {/* Description */}
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-semibold uppercase tracking-wide text-text-muted-fg">
              Description
            </FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder="Describe the item — color, brand, size, any identifying marks or unique features…"
                rows={4}
                className="resize-none rounded-xl border-border-default bg-bg-base px-3.5 py-2.5 text-sm placeholder:text-text-muted-fg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </FormControl>
            <FormDescription className="text-[11px] text-text-muted-fg">
              {field.value?.length ?? 0}/1000 — more detail = better recovery chance
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Location */}
      <FormField
        control={form.control}
        name="location"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-semibold uppercase tracking-wide text-text-muted-fg">
              Location
            </FormLabel>
            <FormControl>
              <input
                {...field}
                placeholder="e.g. Library ground floor, near the exit"
                autoComplete="off"
                className={inputClass}
              />
            </FormControl>
            <FormDescription className="text-[11px] text-text-muted-fg">
              Where was the item lost or found?
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Date */}
      <FormField
        control={form.control}
        name="date_occurred"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-semibold uppercase tracking-wide text-text-muted-fg">
              Date
            </FormLabel>
            <FormControl>
              <input
                {...field}
                type="date"
                max={new Date().toISOString().split("T")[0]}
                className={inputClass}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
