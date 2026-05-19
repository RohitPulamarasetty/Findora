import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 select-none active:scale-[0.97] overflow-hidden",
  {
    variants: {
      variant: {
        // Premium gradient default with glow + inner highlight
        default: [
          "text-white",
          "bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700",
          "shadow-[0_4px_14px_rgb(var(--color-brand-500)/0.40),0_1px_0_rgba(255,255,255,0.15)_inset]",
          "hover:shadow-[0_6px_22px_rgb(var(--color-brand-500)/0.55),0_1px_0_rgba(255,255,255,0.2)_inset]",
          "hover:from-brand-400 hover:via-brand-500 hover:to-brand-600",
          "hover:-translate-y-[1px]",
        ].join(" "),

        // Aurora — for premium CTAs (landing/auth)
        aurora: [
          "text-white",
          "bg-[linear-gradient(135deg,rgb(var(--color-brand-500))_0%,rgb(var(--color-accent-500))_55%,rgb(var(--color-spark-500))_100%)]",
          "bg-[length:200%_200%] bg-[position:0%_50%]",
          "shadow-[0_6px_20px_rgb(var(--color-accent-500)/0.35),0_1px_0_rgba(255,255,255,0.2)_inset]",
          "hover:bg-[position:100%_50%]",
          "hover:shadow-[0_8px_28px_rgb(var(--color-accent-500)/0.5),0_1px_0_rgba(255,255,255,0.25)_inset]",
          "hover:-translate-y-[1px]",
        ].join(" "),

        destructive: [
          "text-white",
          "bg-gradient-to-br from-red-500 to-red-600",
          "shadow-[0_4px_14px_rgba(239,68,68,0.35),0_1px_0_rgba(255,255,255,0.15)_inset]",
          "hover:from-red-400 hover:to-red-500",
          "hover:shadow-[0_6px_22px_rgba(239,68,68,0.5),0_1px_0_rgba(255,255,255,0.2)_inset]",
        ].join(" "),

        outline: [
          "border border-border-default bg-bg-subtle/50 text-text-base backdrop-blur-sm",
          "shadow-sm",
          "hover:border-brand-500/40 hover:bg-bg-subtle hover:text-text-base",
          "hover:shadow-[0_4px_14px_rgb(var(--color-brand-500)/0.10)]",
        ].join(" "),

        secondary: [
          "bg-bg-subtle text-text-secondary border border-border-default",
          "shadow-sm",
          "hover:bg-bg-muted-surface hover:text-text-base hover:border-border-strong",
        ].join(" "),

        ghost: "text-text-secondary hover:bg-bg-subtle hover:text-text-base",
        link: "text-brand-500 underline-offset-4 hover:underline hover:text-brand-600 p-0 h-auto",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3.5 text-xs rounded-lg",
        lg: "h-12 px-7 text-[15px] rounded-xl",
        xl: "h-14 px-9 text-base rounded-2xl",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
