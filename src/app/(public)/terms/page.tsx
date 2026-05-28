import type { Metadata } from "next";
import { FileText, UserCheck, Ban, AlertTriangle, Scale, MessageSquare } from "lucide-react";
import { MarketingShell, MarketingPageHeader } from "@/components/shared/marketing-shell";
import { buildMetadata, JsonLd, breadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Terms & Conditions",
  description:
    "The rules for using Findora — the trusted campus lost & found platform for verified IITM students. Eligibility, acceptable reporting, moderation, and platform terms.",
  path: "/terms",
  keywords: ["Findora terms", "lost and found platform terms", "Findora acceptable use"],
});

const SECTIONS = [
  {
    Icon: UserCheck,
    title: "1. Eligibility",
    body: [
      "Findora is exclusively available to current IITM students with a verified @ds.study.iitm.ac.in, @es.study.iitm.ac.in, or @study.iitm.ac.in account. By signing in you confirm that you are an authorized member of this community.",
      "You are responsible for keeping your account secure. Do not share access with others.",
    ],
  },
  {
    Icon: FileText,
    title: "2. Acceptable use",
    body: [
      "Post truthful, good-faith reports about items you have actually lost or found on campus.",
      "Do not impersonate others, post offensive content, harass users, or use the platform for unrelated trade, advertising, or solicitation.",
      "Treat private messages with respect and discretion.",
    ],
  },
  {
    Icon: Ban,
    title: "3. Prohibited activity",
    body: [
      "Submitting false reports, claiming items that aren't yours, attempting to scam other users, or circumventing identity restrictions will result in suspension or a permanent ban.",
      "Automated scraping, abuse of the API, or attempts to compromise platform security are strictly prohibited.",
    ],
  },
  {
    Icon: AlertTriangle,
    title: "4. Disclaimer",
    body: [
      "Findora is provided “as is” without warranties of any kind. It is a coordination tool — recovery of any specific item is not guaranteed.",
      "We are not responsible for in-person exchanges between users, the condition of items, or any loss arising from use of the service.",
    ],
  },
  {
    Icon: Scale,
    title: "5. Moderation & enforcement",
    body: [
      "Admins may review reports, take down content, and act on abuse reports. We strive to be fair and transparent.",
      "Repeated or serious violations may lead to permanent account suspension without notice.",
    ],
  },
  {
    Icon: MessageSquare,
    title: "6. Changes to these terms",
    body: [
      "We may update these terms occasionally as Findora evolves. Material changes will be communicated through the app or by email. Continued use of the platform constitutes acceptance of any revised terms.",
    ],
  },
];

export default function TermsPage() {
  return (
    <MarketingShell>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Terms & Conditions", path: "/terms" },
        ])}
      />
      <MarketingPageHeader
        eyebrow="Terms & Conditions"
        title="Simple rules for a trusted community."
        description="By using Findora you agree to these terms. They exist to keep the platform safe, useful, and fair for every student and developer who relies on it."
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
              className="bg-accentc-500/8 pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-3xl"
            />
            <div className="relative flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accentc-500/20 bg-gradient-to-br from-accentc-500/15 to-brand-500/10 text-accentc-600 dark:text-accentc-400">
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
