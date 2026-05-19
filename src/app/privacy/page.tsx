import type { Metadata } from "next";
import { Lock, Database, Eye, Cookie, Shield, Mail } from "lucide-react";
import { MarketingShell, MarketingPageHeader } from "@/components/shared/marketing-shell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Findora collects, uses, and protects your data.",
};

const SECTIONS = [
  {
    Icon: Database,
    title: "1. Information we collect",
    body: [
      "Your IITM DS email address, name, and profile photo (from Google sign-in).",
      "Content you create — item reports, photos, messages, and case status.",
      "Basic technical data such as IP address, browser type, and timestamps for security and abuse prevention.",
    ],
  },
  {
    Icon: Eye,
    title: "2. How we use your information",
    body: [
      "To operate Findora — authenticate your account, display your reports, and route messages between owners and finders.",
      "To moderate content and investigate abuse reports.",
      "To improve the product through aggregate, non-identifying analytics.",
    ],
  },
  {
    Icon: Shield,
    title: "3. Identity & access",
    body: [
      "Findora is restricted to verified @ds.study.iitm.ac.in accounts via Google OAuth. We do not create or store passwords.",
      "Row-level security in our database ensures you can only access data you are authorized to see.",
      "Admins can act on abuse reports and remove content that violates the terms.",
    ],
  },
  {
    Icon: Cookie,
    title: "4. Cookies & sessions",
    body: [
      "We use first-party session cookies to keep you signed in. We do not use third-party advertising or tracking cookies.",
      "Cookies are encrypted and expire automatically when your session ends or you sign out.",
    ],
  },
  {
    Icon: Lock,
    title: "5. Data retention & deletion",
    body: [
      "Item reports remain until you delete them, close the case, or your account is removed.",
      "You can request account deletion by contacting us. We will remove your profile and disassociate your reports within a reasonable period, subject to legal and abuse-prevention requirements.",
    ],
  },
  {
    Icon: Mail,
    title: "6. Contact",
    body: [
      "Questions, concerns, or data requests? Reach us via the Contact page. We aim to respond within a few business days.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <MarketingPageHeader
        eyebrow="Privacy Policy"
        title="Your data, handled with care."
        description="Findora is built around verified identity and minimal data collection. This page describes what we collect, why we collect it, and how it's protected."
        lastUpdated="May 2026"
      />

      <div className="mx-auto grid max-w-4xl gap-3 pb-12 sm:gap-4 sm:pb-16">
        {SECTIONS.map(({ Icon, title, body }) => (
          <section
            key={title}
            className="hover:shadow-card-hover group relative overflow-hidden rounded-2xl border border-border-default bg-bg-subtle/70 p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-border-strong sm:p-7"
          >
            <div
              aria-hidden
              className="bg-brand-500/8 pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-3xl"
            />
            <div className="relative flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-500/20 bg-gradient-to-br from-brand-500/15 to-accentc-500/10 text-brand-600 dark:text-brand-400">
                <Icon size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-[15.5px] font-bold tracking-tight text-text-base sm:text-[16px]">
                  {title}
                </h2>
                <div className="mt-2 space-y-2 text-[13.5px] leading-relaxed text-text-secondary">
                  {body.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </MarketingShell>
  );
}
