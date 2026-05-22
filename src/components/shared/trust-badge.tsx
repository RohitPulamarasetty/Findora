/**
 * TrustBadge — visual signal of a user's recovery history.
 *
 * Levels (mirrored from the SQL view `user_trust_profiles`):
 *   - newcomer  (0 recoveries) — neutral, "New here"
 *   - bronze    (1+)           — bronze star
 *   - silver    (5+)           — silver star
 *   - gold      (10+)          — gold star
 *
 * Security: `recoveries_count` is bumped only by the SECURITY DEFINER
 * trigger `bump_recoveries_on_complete` (mig. 0015). Column-level REVOKE
 * blocks client writes. The level is derived purely from the count — no
 * spoofable client state.
 *
 * Sizes: `sm` (inline, ~10px text), `md` (default, ~11px), `lg` (profile).
 */
import { Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export type TrustLevel = "newcomer" | "bronze" | "silver" | "gold";

export function levelFromCount(count: number | null | undefined): TrustLevel {
  const n = count ?? 0;
  if (n >= 10) return "gold";
  if (n >= 5) return "silver";
  if (n >= 1) return "bronze";
  return "newcomer";
}

const LEVEL_LABEL: Record<TrustLevel, string> = {
  newcomer: "New here",
  bronze: "Helper",
  silver: "Trusted",
  gold: "Top helper",
};

const LEVEL_CLASS: Record<TrustLevel, string> = {
  newcomer: "bg-bg-muted-surface text-text-muted-fg ring-1 ring-border-default",
  bronze:
    "bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-300 dark:bg-amber-500/15",
  silver:
    "bg-slate-400/15 text-slate-700 ring-1 ring-slate-400/30 dark:text-slate-200 dark:bg-slate-400/15",
  gold: "bg-yellow-500/15 text-yellow-700 ring-1 ring-yellow-500/35 dark:text-yellow-300 dark:bg-yellow-500/15",
};

interface TrustBadgeProps {
  /** Number of completed recoveries the user has been part of. */
  recoveriesCount?: number | null;
  /** Explicit level override (skips the count → level derivation). */
  level?: TrustLevel;
  /** Visual size. Defaults to `md`. */
  size?: "sm" | "md" | "lg";
  /** Show numeric count alongside the label (e.g. "Helper · 3"). */
  showCount?: boolean;
  className?: string;
}

/**
 * Inline trust badge. Renders an icon + short label + optional count.
 * Title attribute on the wrapper gives screen readers + hover-tooltip
 * the long description.
 */
export function TrustBadge({
  recoveriesCount,
  level,
  size = "md",
  showCount = false,
  className,
}: TrustBadgeProps) {
  const resolved = level ?? levelFromCount(recoveriesCount);
  const label = LEVEL_LABEL[resolved];
  const count = recoveriesCount ?? 0;

  const Icon = resolved === "newcomer" ? Sparkles : Star;
  const iconSize = size === "sm" ? 10 : size === "lg" ? 14 : 12;
  const textSize = size === "sm" ? "text-[10px]" : size === "lg" ? "text-[12.5px]" : "text-[11px]";
  const pad = size === "sm" ? "px-1.5 py-0.5" : size === "lg" ? "px-2.5 py-1" : "px-2 py-0.5";

  const aria =
    resolved === "newcomer"
      ? "New to Findora"
      : `Helped recover ${count} item${count === 1 ? "" : "s"} on Findora`;

  return (
    <span
      role="img"
      aria-label={aria}
      title={aria}
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold leading-none",
        pad,
        textSize,
        LEVEL_CLASS[resolved],
        className
      )}
    >
      <Icon size={iconSize} aria-hidden="true" className="shrink-0" />
      <span>{label}</span>
      {showCount && resolved !== "newcomer" && (
        <span className="opacity-70" aria-hidden="true">
          · {count}
        </span>
      )}
    </span>
  );
}
