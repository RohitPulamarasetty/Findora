import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "ease-[cubic-bezier(0.16,1,0.3,1)] flex min-h-[96px] w-full rounded-xl border border-border-default bg-bg-subtle/70 px-4 py-3 text-sm text-text-base shadow-sm backdrop-blur-sm transition-all duration-200 placeholder:text-text-muted-fg hover:border-border-strong hover:bg-bg-subtle focus-visible:border-brand-500 focus-visible:bg-bg-subtle focus-visible:shadow-[0_0_0_4px_rgb(var(--color-brand-500)/0.15),0_4px_14px_rgb(var(--color-brand-500)/0.15)] focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-bg-muted-surface disabled:opacity-50 dark:bg-bg-subtle/50 dark:focus-visible:bg-bg-subtle",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
