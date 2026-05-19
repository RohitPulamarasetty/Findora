import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "ease-[cubic-bezier(0.16,1,0.3,1)] flex h-11 w-full rounded-xl border border-border-default bg-bg-subtle/70 px-4 py-2 text-sm text-text-base shadow-sm backdrop-blur-sm transition-all duration-200",
          "placeholder:text-text-muted-fg",
          "hover:border-border-strong hover:bg-bg-subtle",
          "focus-visible:border-brand-500 focus-visible:bg-bg-subtle focus-visible:outline-none",
          "focus-visible:shadow-[0_0_0_4px_rgb(var(--color-brand-500)/0.15),0_4px_14px_rgb(var(--color-brand-500)/0.15)]",
          "disabled:cursor-not-allowed disabled:bg-bg-muted-surface disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-text-base",
          "dark:bg-bg-subtle/50 dark:focus-visible:bg-bg-subtle",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
