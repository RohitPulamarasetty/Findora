import type { LucideIcon } from "lucide-react";
import { TrendingUp } from "lucide-react";

interface AdminStatsCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  sub?: string;
  trend?: number;
  accent?: "default" | "green" | "amber" | "red";
}

const ACCENT_MAP = {
  default: {
    icon: "bg-brand-500/12 text-brand-500 dark:text-brand-400",
    border: "border-border-default",
    glow: "from-brand-500/6",
  },
  green: {
    icon: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
    border: "border-border-default",
    glow: "from-emerald-500/6",
  },
  amber: {
    icon: "bg-amber-500/12 text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20",
    glow: "from-amber-500/6",
  },
  red: {
    icon: "bg-red-500/12 text-red-600 dark:text-red-400",
    border: "border-red-500/20",
    glow: "from-red-500/6",
  },
};

export function AdminStatsCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  accent = "default",
}: AdminStatsCardProps) {
  const { icon: iconClass, border, glow } = ACCENT_MAP[accent];

  return (
    <div
      className={`relative overflow-hidden rounded-xl border ${border} bg-gradient-to-br ${glow} hover:shadow-card-hover bg-bg-subtle to-transparent p-4 shadow-card transition-all`}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
        >
          <Icon size={16} aria-hidden="true" />
        </div>
        {trend != null && (
          <div className="flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            <TrendingUp size={9} />
            {trend}%
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-[24px] font-bold tabular-nums leading-none text-text-base">{value}</p>
        <p className="mt-1 text-[11px] font-medium text-text-muted-fg">{label}</p>
        {sub && <p className="mt-0.5 text-[10px] text-text-secondary">{sub}</p>}
      </div>
    </div>
  );
}
