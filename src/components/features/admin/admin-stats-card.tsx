"use client";

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
    icon: "bg-brand-500/10 text-brand-500",
    glow: "from-brand-500/5",
  },
  green: {
    icon: "bg-emerald-500/10 text-emerald-500",
    glow: "from-emerald-500/5",
  },
  amber: {
    icon: "bg-amber-500/10 text-amber-500",
    glow: "from-amber-500/5",
  },
  red: {
    icon: "bg-red-500/10 text-red-500",
    glow: "from-red-500/5",
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
  const { icon: iconClass, glow } = ACCENT_MAP[accent];

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-border-default bg-gradient-to-br ${glow} bg-bg-base to-transparent p-4 shadow-sm`}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
        >
          <Icon size={18} aria-hidden="true" />
        </div>
        {trend != null && (
          <div className="flex items-center gap-0.5 text-[11px] font-medium text-emerald-500">
            <TrendingUp size={11} />
            {trend}%
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold tabular-nums text-text-base">{value}</p>
        <p className="mt-0.5 text-xs text-text-muted-fg">{label}</p>
        {sub && <p className="mt-0.5 text-[11px] text-text-secondary">{sub}</p>}
      </div>
    </div>
  );
}
