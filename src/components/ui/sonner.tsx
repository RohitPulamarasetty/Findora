"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-bg-base group-[.toaster]:text-text-base group-[.toaster]:border-border-default group-[.toaster]:shadow-high group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-text-muted-fg",
          actionButton:
            "group-[.toast]:bg-brand-500 group-[.toast]:text-white group-[.toast]:rounded-lg group-[.toast]:font-semibold",
          cancelButton:
            "group-[.toast]:bg-bg-subtle group-[.toast]:text-text-secondary group-[.toast]:rounded-lg",
          success: "group-[.toaster]:border-emerald-500/20 group-[.toaster]:bg-emerald-500/5",
          error: "group-[.toaster]:border-red-500/20 group-[.toaster]:bg-red-500/5",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
