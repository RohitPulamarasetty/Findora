import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface MarketingShellProps {
  children: React.ReactNode;
  /** Visible in top bar back button. Defaults to "/". */
  backHref?: string;
  /** "/login" or "/home" — the primary CTA in the top bar. */
  primaryCtaHref?: string;
  primaryCtaLabel?: string;
}

/**
 * Theme-aware shell for public marketing/legal pages (privacy, terms,
 * contact). Uses app design-system tokens so it adapts to dark/light mode.
 * The body ambient aurora wash from globals.css provides the background.
 */
export function MarketingShell({
  children,
  backHref = "/",
  primaryCtaHref = "/login",
  primaryCtaLabel = "Open app",
}: MarketingShellProps) {
  return (
    <div className="relative min-h-screen bg-bg-base text-text-base">
      <div className="relative z-10">
        {/* Top bar */}
        <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border-default/70 bg-bg-base/70 backdrop-blur-2xl">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent"
          />
          <div className="relative mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link
              href={backHref}
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-base"
            >
              <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
              Back
            </Link>
            <Link href="/" className="flex items-center gap-2.5">
              <div className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg ring-1 ring-border-default">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-accentc-600 opacity-90" />
                <Image
                  src="/favicon-96x96.png"
                  alt="Findora"
                  width={28}
                  height={28}
                  className="relative z-10"
                />
              </div>
              <span className="text-[15px] font-bold tracking-tight">Findora</span>
            </Link>
            <Link
              href={primaryCtaHref}
              className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-lg px-3.5 py-1.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgb(var(--color-brand-500)/0.35)] transition-all hover:-translate-y-px hover:shadow-[0_6px_22px_rgb(var(--color-brand-500)/0.5)]"
            >
              <span className="absolute inset-0 bg-gradient-to-br from-brand-500 to-brand-700" />
              <span className="relative">{primaryCtaLabel}</span>
              <ArrowRight size={13} className="relative" />
            </Link>
          </div>
        </nav>

        <main className="px-4 pt-24 sm:px-6 sm:pt-28">{children}</main>

        {/* Footer */}
        <footer className="mt-20 border-t border-border-default/70 px-4 py-8 sm:mt-28 sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-md ring-1 ring-border-default">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-accentc-600 opacity-90" />
                <Image
                  src="/favicon-96x96.png"
                  alt="Findora"
                  width={24}
                  height={24}
                  className="relative z-10"
                />
              </div>
              <span className="text-[13px] font-semibold text-text-base">Findora</span>
              <span className="hidden text-[11px] text-text-muted-fg sm:inline-block">
                &middot; &copy; {new Date().getFullYear()}
              </span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-text-muted-fg">
              <Link href="/about" className="transition-colors hover:text-text-base">
                About
              </Link>
              <Link href="/privacy" className="transition-colors hover:text-text-base">
                Privacy
              </Link>
              <Link href="/terms" className="transition-colors hover:text-text-base">
                Terms
              </Link>
              <Link href="/contact" className="transition-colors hover:text-text-base">
                Contact
              </Link>
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
}

/** Section heading used at the top of each legal/contact page. */
export function MarketingPageHeader({
  eyebrow,
  title,
  description,
  lastUpdated,
}: {
  eyebrow: string;
  title: string;
  description: string;
  lastUpdated?: string;
}) {
  return (
    <header className="mx-auto max-w-3xl pb-10 pt-8 text-center sm:pb-14 sm:pt-12">
      <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-brand-500/20 bg-brand-500/10 px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.15em] text-brand-600 dark:text-brand-300">
        {eyebrow}
      </div>
      <h1 className="text-[30px] font-bold leading-[1.1] tracking-[-0.025em] sm:text-[38px]">
        {title}
      </h1>
      <p className="mx-auto mt-4 max-w-[58ch] text-[14px] leading-relaxed text-text-secondary sm:text-[15px]">
        {description}
      </p>
      {lastUpdated && (
        <p className="mt-3 text-[11.5px] uppercase tracking-[0.15em] text-text-muted-fg">
          Last updated · {lastUpdated}
        </p>
      )}
    </header>
  );
}
