"use client";

import type { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { CategoryPicker } from "@/components/features/items/category-picker";
import type { CreateItemInput } from "@/lib/validations";

interface BasicInfoStepProps {
  form: UseFormReturn<CreateItemInput>;
}

const TYPE_OPTIONS = [
  {
    value: "lost" as const,
    label: "Lost Item",
    emoji: "🔴",
    activeClass:
      "border-red-400/70 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 dark:border-red-700/50",
    desc: "I lost something",
  },
  {
    value: "found" as const,
    label: "Found Item",
    emoji: "🟢",
    activeClass:
      "border-emerald-400/70 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-700/50",
    desc: "I found something",
  },
] as const;

export function BasicInfoStep({ form }: BasicInfoStepProps) {
  return (
    <div className="space-y-5">
      {/* Type selector */}
      <FormField
        control={form.control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-semibold uppercase tracking-wide text-text-muted-fg">
              What are you reporting?
            </FormLabel>
            <FormControl>
              <div className="grid grid-cols-2 gap-2.5">
                {TYPE_OPTIONS.map(({ value, label, emoji, activeClass, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => field.onChange(value)}
                    aria-pressed={field.value === value}
                    className={`flex flex-col items-start gap-0.5 rounded-xl border px-3.5 py-3 text-left transition-all duration-150 ${
                      field.value === value
                        ? activeClass
                        : "border-border-default bg-bg-subtle text-text-secondary hover:bg-bg-muted-surface"
                    }`}
                  >
                    <span className="text-base leading-none">{emoji}</span>
                    <span className="text-[13px] font-semibold">{label}</span>
                    <span className="text-[11px] opacity-70">{desc}</span>
                  </button>
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Title */}
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-semibold uppercase tracking-wide text-text-muted-fg">
              Item title
            </FormLabel>
            <FormControl>
              <input
                {...field}
                placeholder="e.g. Blue Sony WH-1000XM4 headphones"
                autoComplete="off"
                className="w-full rounded-xl border border-border-default bg-bg-base px-3.5 py-2.5 text-sm text-text-base transition-colors placeholder:text-text-muted-fg focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Category */}
      <FormField
        control={form.control}
        name="category"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-semibold uppercase tracking-wide text-text-muted-fg">
              Category
            </FormLabel>
            <FormControl>
              <CategoryPicker value={field.value} onChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
