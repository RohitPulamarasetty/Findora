"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  back?: boolean | string;
  action?: React.ReactNode;
  className?: string;
  sticky?: boolean;
}

export function PageHeader({ title, back, action, className, sticky = false }: PageHeaderProps) {
  const router = useRouter();

  function handleBack() {
    if (typeof back === "string") router.push(back);
    else router.back();
  }

  return (
    <header
      className={cn(
        "relative flex min-h-[64px] items-center gap-3 border-b border-border-default/70 px-4 py-3.5",
        "bg-bg-base/70 backdrop-blur-2xl",
        sticky && "sticky top-0 z-30",
        className
      )}
    >
      {/* subtle accent line at bottom */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent"
      />
      {back && (
        <button
          onClick={handleBack}
          aria-label="Go back"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border-default/60 bg-bg-subtle/60 text-text-secondary backdrop-blur transition-all duration-200 hover:-translate-x-0.5 hover:border-brand-500/40 hover:bg-bg-subtle hover:text-text-base hover:shadow-[0_4px_12px_rgb(var(--color-brand-500)/0.15)]"
        >
          <ArrowLeft size={18} />
        </button>
      )}
      <h1 className="flex-1 text-[17px] font-extrabold tracking-tight text-text-base">{title}</h1>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
