import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/30",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-[0_2px_8px_rgb(var(--color-brand-500)/0.35)] hover:from-brand-400 hover:to-brand-500",
        aurora:
          "border-transparent text-white shadow-[0_2px_8px_rgb(var(--color-accent-500)/0.35)] bg-[linear-gradient(135deg,rgb(var(--color-brand-500)),rgb(var(--color-accent-500)),rgb(var(--color-spark-500)))]",
        secondary:
          "border-border-default bg-bg-subtle/80 text-text-secondary backdrop-blur-sm hover:bg-bg-muted-surface",
        destructive:
          "border-transparent bg-gradient-to-br from-red-500 to-red-600 text-white shadow-[0_2px_8px_rgba(239,68,68,0.35)]",
        outline: "border-border-strong text-text-base hover:bg-bg-subtle hover:border-brand-500/40",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
