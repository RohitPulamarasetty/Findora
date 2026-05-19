import { cn } from "@/lib/utils";
import type { ItemStatus } from "@/types/items";

interface StatusBadgeProps {
  status: ItemStatus;
  size?: "sm" | "md";
  className?: string;
}

const STATUS_CONFIG: Record<ItemStatus, { label: string; dot: string; className: string }> = {
  active: {
    label: "Active",
    dot: "bg-sky-500",
    className: "bg-sky-500/10 text-sky-600 dark:text-sky-400 ring-1 ring-sky-500/20",
  },
  claim_pending: {
    label: "Pending",
    dot: "bg-amber-500",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20",
  },
  verified: {
    label: "Verified",
    dot: "bg-violet-500",
    className: "bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/20",
  },
  completed: {
    label: "Recovered",
    dot: "bg-emerald-500",
    className:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20",
  },
  closed: {
    label: "Closed",
    dot: "bg-text-muted-fg",
    className: "bg-bg-muted-surface text-text-muted-fg ring-1 ring-border-default",
  },
};

export function StatusBadge({ status, size = "md", className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold backdrop-blur-sm",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]",
        config.className,
        className
      )}
    >
      {size !== "sm" && <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", config.dot)} />}
      {config.label}
    </span>
  );
}
