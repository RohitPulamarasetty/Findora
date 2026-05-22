import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageSquare, Code2, Bug, Send, Sparkles } from "lucide-react";
import { MarketingShell, MarketingPageHeader } from "@/components/shared/marketing-shell";
import { SupportCTA } from "@/components/shared/support-cta";
import { buildMetadata, JsonLd, breadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contact & Support",
  description:
    "Reach the Findora team — general enquiries, bug reports, abuse and safety concerns about the campus lost & found platform. Built for verified IITM DS students.",
  path: "/contact",
  keywords: [
    "Findora contact",
    "Findora support",
    "report abuse Findora",
    "Findora bug report",
    "campus lost and found contact",
  ],
});

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "rohitpulamarasetty@gmail.com";
const GITHUB_REPO =
  process.env.NEXT_PUBLIC_GITHUB_REPO || "https://github.com/RohitPulamarasetty/Findora";

const CHANNELS = [
  {
    Icon: Mail,
    title: "General enquiries",
    desc: "Questions about the product, partnerships, or feedback.",
    cta: "Send an email",
    href: `mailto:${CONTACT_EMAIL}`,
    accent: "brand",
  },
  {
    Icon: Bug,
    title: "Report a bug",
    desc: "Found something broken? File an issue with steps to reproduce.",
    cta: "Open an issue",
    href: GITHUB_REPO,
    accent: "accent",
  },
  {
    Icon: MessageSquare,
    title: "Abuse & safety",
    desc: "Spotted misuse, harassment, or a suspicious account? Let us know.",
    cta: "Email the team",
    href: `mailto:${CONTACT_EMAIL}?subject=Abuse%20Report`,
    accent: "rose",
  },
] as const;

const ACCENT_MAP = {
  brand: {
    ring: "border-brand-500/20",
    bg: "from-brand-500/15 to-accentc-500/10",
    text: "text-brand-600 dark:text-brand-400",
    glow: "bg-brand-500/8",
  },
  accent: {
    ring: "border-accentc-500/20",
    bg: "from-accentc-500/15 to-brand-500/10",
    text: "text-accentc-600 dark:text-accentc-400",
    glow: "bg-accentc-500/8",
  },
  rose: {
    ring: "border-rose-500/20",
    bg: "from-rose-500/15 to-amber-500/10",
    text: "text-rose-600 dark:text-rose-400",
    glow: "bg-rose-500/10",
  },
} as const;

export default function ContactPage() {
  return (
    <MarketingShell>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
      <MarketingPageHeader
        eyebrow="Contact & Support"
        title="We'd love to hear from you."
        description="Whether you've spotted a bug, have an idea to share, or want to help support the project — pick the channel that fits."
      />

      {/* Channels grid */}
      <div className="mx-auto grid max-w-5xl gap-3 pb-12 sm:grid-cols-3 sm:gap-4 sm:pb-16">
        {CHANNELS.map(({ Icon, title, desc, cta, href, accent }) => {
          const a = ACCENT_MAP[accent];
          return (
            <div
              key={title}
              className="hover:shadow-card-hover group relative flex flex-col overflow-hidden rounded-2xl border border-border-default bg-bg-subtle/70 p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-border-strong sm:p-6"
            >
              <div
                aria-hidden
                className={`pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full ${a.glow} blur-2xl`}
              />
              <div
                className={`relative mb-3.5 flex h-10 w-10 items-center justify-center rounded-xl border ${a.ring} bg-gradient-to-br ${a.bg} ${a.text}`}
              >
                <Icon size={17} />
              </div>
              <h3 className="relative text-[15px] font-semibold tracking-tight text-text-base">
                {title}
              </h3>
              <p className="relative mt-1.5 flex-1 text-[12.5px] leading-relaxed text-text-secondary">
                {desc}
              </p>
              <Link
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="group/cta relative mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
              >
                {cta}
                <Send size={12} className="transition-transform group-hover/cta:translate-x-0.5" />
              </Link>
            </div>
          );
        })}
      </div>

      {/* Quick info strip */}
      <div className="mx-auto mb-12 max-w-5xl rounded-2xl border border-border-default bg-bg-subtle/60 p-5 backdrop-blur-md sm:mb-16 sm:p-6">
        <div className="grid gap-4 text-center sm:grid-cols-3 sm:text-left">
          <div className="flex items-center justify-center gap-3 sm:justify-start">
            <Mail size={16} className="text-brand-500" />
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.15em] text-text-muted-fg">
                Email
              </p>
              <p className="text-[13px] font-medium text-text-base">{CONTACT_EMAIL}</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 sm:justify-start">
            <Code2 size={16} className="text-text-secondary" />
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.15em] text-text-muted-fg">
                Source
              </p>
              <Link
                href={GITHUB_REPO}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] font-medium text-text-base transition-colors hover:text-brand-500"
              >
                View on GitHub
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 sm:justify-start">
            <Sparkles size={16} className="text-accentc-500" />
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.15em] text-text-muted-fg">
                Response time
              </p>
              <p className="text-[13px] font-medium text-text-base">Within a few business days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Support CTA — Razorpay */}
      <div className="mx-auto max-w-4xl pb-4">
        <SupportCTA variant="app" />
      </div>
    </MarketingShell>
  );
}
