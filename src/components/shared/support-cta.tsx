import { Heart, Sparkles, ShieldCheck } from "lucide-react";
import { SupportButton } from "./support-button";
import { SUPPORT_CTA_LABEL, SUPPORT_DESCRIPTION } from "@/lib/support";

interface SupportCTAProps {
  /** "marketing" → dark landing aesthetic. "app" → theme-aware app surface. */
  variant?: "marketing" | "app";
  heading?: string;
  description?: string;
  ctaLabel?: string;
}

/**
 * Premium Razorpay support card. The CTA opens the Razorpay Standard
 * Checkout modal via {@link SupportButton}, which calls the server-side
 * order-create + signature-verify endpoints.
 */
export function SupportCTA({
  variant = "marketing",
  heading = "Help shape the next generation of student tools.",
  description = SUPPORT_DESCRIPTION,
  ctaLabel = SUPPORT_CTA_LABEL,
}: SupportCTAProps) {
  if (variant === "app") {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-border-default bg-bg-subtle/80 p-6 backdrop-blur-md sm:p-9">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 -top-16 h-60 w-60 rounded-full bg-brand-500/15 blur-[80px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -right-16 h-60 w-60 rounded-full bg-accentc-500/15 blur-[80px]"
        />
        <div className="relative grid items-center gap-6 sm:grid-cols-[1fr_auto] sm:gap-10">
          <div>
            <div className="dark:text-brand-300 mb-3 inline-flex items-center gap-1.5 rounded-full border border-brand-500/25 bg-brand-500/10 px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.15em] text-brand-600">
              <Heart size={11} />
              {ctaLabel}
            </div>
            <h3 className="text-[20px] font-bold tracking-[-0.02em] text-text-base sm:text-[22px]">
              {heading}
            </h3>
            <p className="mt-2 max-w-[48ch] text-[13px] leading-relaxed text-text-secondary sm:text-[13.5px]">
              {description}
            </p>
            <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-text-muted-fg">
              <ShieldCheck size={11} className="text-emerald-500" />
              Secured by Razorpay · UPI, cards &amp; net banking supported
            </p>
          </div>
          <div className="flex justify-start sm:justify-end">
            <SupportButton label={ctaLabel} />
          </div>
        </div>
      </div>
    );
  }

  // Marketing variant — matches landing/about dark aesthetic
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] via-[#0a0a10]/40 to-white/[0.02] p-6 backdrop-blur-md sm:p-9">
      <div className="pointer-events-none absolute -left-16 -top-16 h-60 w-60 rounded-full bg-blue-500/15 blur-[80px]" />
      <div className="pointer-events-none absolute -bottom-16 -right-16 h-60 w-60 rounded-full bg-violet-500/15 blur-[80px]" />

      <div className="relative grid items-center gap-6 sm:grid-cols-[1fr_auto] sm:gap-10">
        <div>
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-blue-400/25 bg-blue-500/10 px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.15em] text-blue-300">
            <Heart size={11} />
            {ctaLabel}
          </div>
          <h3 className="text-[20px] font-bold tracking-[-0.02em] text-white sm:text-[22px]">
            {heading}
          </h3>
          <p className="mt-2 max-w-[48ch] text-[13px] leading-relaxed text-white/55 sm:text-[13.5px]">
            {description}
          </p>
          <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-white/45">
            <ShieldCheck size={11} className="text-emerald-400" />
            Secured by Razorpay · UPI, cards &amp; net banking supported
          </p>
        </div>
        <div className="flex justify-start sm:justify-end">
          <SupportButton label={ctaLabel}>
            <button
              type="button"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl px-6 py-3 text-[13.5px] font-semibold text-white shadow-[0_8px_24px_rgba(59,130,246,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all hover:-translate-y-px hover:shadow-[0_12px_32px_rgba(59,130,246,0.5),inset_0_1px_0_rgba(255,255,255,0.25)]"
            >
              <span className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-violet-600" />
              <span className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />
              <Sparkles size={14} className="relative" />
              <span className="relative">{ctaLabel}</span>
            </button>
          </SupportButton>
        </div>
      </div>
    </div>
  );
}
