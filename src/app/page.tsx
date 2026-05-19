import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Search,
  MessageCircle,
  Shield,
  Zap,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Package,
  Users,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";

const SOCIAL_ICONS = {
  github: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.11.79-.25.79-.56v-1.97c-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.8 1.18 1.83 1.18 3.09 0 4.43-2.69 5.4-5.26 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.36V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .78 0 1.74v20.52C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.74V1.74C24 .78 23.2 0 22.22 0Z" />
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  ),
};

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/home");

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#08080c] text-white">
      {/* ── Global ambient background ─────────────────────────────── */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        {/* dotted grid */}
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage: "radial-gradient(rgb(255 255 255 / 0.08) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* aurora glows */}
        <div className="absolute left-1/2 top-0 h-[700px] w-[900px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-blue-600/20 blur-[140px]" />
        <div className="absolute right-[-10%] top-[30%] h-[480px] w-[480px] rounded-full bg-violet-600/15 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-[120px]" />
        {/* top-to-bottom darkening */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </div>

      <div className="relative z-10">
        {/* ── Navigation ──────────────────────────────────────────── */}
        <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/[0.06] bg-[#08080c]/70 backdrop-blur-2xl">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg ring-1 ring-white/10">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-violet-600 opacity-80" />
                <Image
                  src="/favicon-96x96.png"
                  alt="Findora"
                  width={28}
                  height={28}
                  priority
                  className="relative z-10"
                />
              </div>
              <span className="text-[15px] font-bold tracking-tight">Findora</span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/about"
                className="hidden text-sm font-medium text-white/60 transition-colors hover:text-white sm:inline-block"
              >
                About
              </Link>
              <Link
                href="/login"
                className="hidden text-sm font-medium text-white/60 transition-colors hover:text-white sm:inline-block"
              >
                Sign in
              </Link>
              <Link
                href="/login"
                className="group inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-sm font-semibold text-black shadow-[0_4px_14px_rgba(255,255,255,0.15)] transition-all hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(255,255,255,0.25)] sm:px-4"
              >
                Get started
                <ArrowRight
                  size={14}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </div>
        </nav>

        {/* ── Hero ────────────────────────────────────────────────── */}
        <section className="relative px-4 pb-16 pt-28 sm:px-6 sm:pb-24 sm:pt-32">
          <div className="relative mx-auto max-w-3xl text-center">
            {/* Eyebrow badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-white/70 backdrop-blur-md">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              <span className="tracking-wide">IITM DS Campus Platform</span>
            </div>

            <h1 className="mx-auto max-w-[18ch] text-[34px] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[44px] sm:leading-[1.05] md:text-[54px]">
              Find what&apos;s{" "}
              <span className="bg-gradient-to-br from-blue-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                lost
              </span>
              .
              <br className="hidden sm:block" /> Return what&apos;s{" "}
              <span className="bg-gradient-to-br from-emerald-300 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                found
              </span>
              .
            </h1>

            <p className="mx-auto mt-5 max-w-[44ch] text-[14.5px] leading-relaxed text-white/55 sm:mt-6 sm:text-[15.5px]">
              A secure, centralized platform replacing scattered WhatsApp groups and notice boards —
              verified with your IITM DS identity.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col items-center justify-center gap-2.5 sm:flex-row sm:gap-3">
              <Link
                href="/login"
                className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-6 py-3 text-[13.5px] font-semibold text-white shadow-[0_8px_24px_rgba(59,130,246,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all hover:-translate-y-px hover:shadow-[0_12px_32px_rgba(59,130,246,0.5),inset_0_1px_0_rgba(255,255,255,0.25)] sm:w-auto"
              >
                <span className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-violet-600" />
                <span className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />
                <span className="relative">Sign in with Google</span>
                <ArrowRight
                  size={15}
                  className="relative transition-transform group-hover:translate-x-0.5"
                />
              </Link>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-6 py-3 text-[13.5px] font-semibold text-white/80 backdrop-blur-md transition-all hover:border-white/[0.18] hover:bg-white/[0.06] hover:text-white sm:w-auto"
              >
                Browse the platform
              </Link>
            </div>

            <p className="mt-5 text-[11.5px] text-white/35">
              Exclusive to <span className="font-medium text-white/55">@ds.study.iitm.ac.in</span>{" "}
              accounts
            </p>
          </div>

          {/* Stats */}
          <div className="relative mx-auto mt-14 max-w-2xl sm:mt-20">
            <div className="absolute -inset-x-4 -top-6 h-[200px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(59,130,246,0.18),transparent_70%)]" />
            <div className="relative grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md">
              {[
                { value: "<48h", label: "Avg. recovery time" },
                { value: "80%+", label: "Resolution rate" },
                { value: "100%", label: "Verified users" },
              ].map((stat, i) => (
                <div key={i} className="bg-[#08080c]/80 px-4 py-5 text-center sm:py-6">
                  <div className="bg-gradient-to-b from-white to-white/70 bg-clip-text text-[19px] font-bold tracking-tight text-transparent sm:text-[22px]">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-[10.5px] tracking-wide text-white/45 sm:text-[11px]">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ────────────────────────────────────────────── */}
        <section className="relative px-4 py-20 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 text-center sm:mb-14">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.15em] text-white/55">
                <Sparkles size={11} className="text-blue-400" />
                Features
              </div>
              <h2 className="text-[22px] font-bold tracking-[-0.02em] sm:text-[28px]">
                Everything you need to recover what matters
              </h2>
              <p className="mx-auto mt-2 max-w-[42ch] text-[13px] text-white/45 sm:text-sm">
                Designed for the pace of campus life — fast, private, and structured.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {[
                {
                  icon: Shield,
                  color: "blue",
                  title: "Verified Identity",
                  desc: "Only @ds.study.iitm.ac.in accounts. No anonymous users, no fake reports.",
                },
                {
                  icon: Zap,
                  color: "amber",
                  title: "Instant Matching",
                  desc: "Smart search across title, description, category, and location.",
                },
                {
                  icon: MessageCircle,
                  color: "violet",
                  title: "Secure Messaging",
                  desc: "Private in-app conversations between owner and finder.",
                },
                {
                  icon: MapPin,
                  color: "emerald",
                  title: "Location Context",
                  desc: "Log where items were lost or found to narrow down searches.",
                },
                {
                  icon: CheckCircle2,
                  color: "green",
                  title: "Full Lifecycle",
                  desc: "Track items from reported to recovered with clean audit trails.",
                },
                {
                  icon: Package,
                  color: "rose",
                  title: "Rich Reports",
                  desc: "Up to 5 photos per report. Categories, dates, descriptions — structured.",
                },
              ].map((feature, i) => {
                const colorMap: Record<string, { bg: string; text: string; glow: string }> = {
                  blue: {
                    bg: "from-blue-500/20 to-blue-500/5",
                    text: "text-blue-300",
                    glow: "shadow-[0_0_28px_rgba(59,130,246,0.25)]",
                  },
                  amber: {
                    bg: "from-amber-500/20 to-amber-500/5",
                    text: "text-amber-300",
                    glow: "shadow-[0_0_28px_rgba(245,158,11,0.25)]",
                  },
                  violet: {
                    bg: "from-violet-500/20 to-violet-500/5",
                    text: "text-violet-300",
                    glow: "shadow-[0_0_28px_rgba(139,92,246,0.25)]",
                  },
                  emerald: {
                    bg: "from-emerald-500/20 to-emerald-500/5",
                    text: "text-emerald-300",
                    glow: "shadow-[0_0_28px_rgba(16,185,129,0.25)]",
                  },
                  green: {
                    bg: "from-green-500/20 to-green-500/5",
                    text: "text-green-300",
                    glow: "shadow-[0_0_28px_rgba(34,197,94,0.25)]",
                  },
                  rose: {
                    bg: "from-rose-500/20 to-rose-500/5",
                    text: "text-rose-300",
                    glow: "shadow-[0_0_28px_rgba(244,63,94,0.25)]",
                  },
                };
                const c = colorMap[feature.color];
                return (
                  <div
                    key={i}
                    className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.14] hover:bg-white/[0.045]"
                  >
                    {/* subtle gradient sweep on hover */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <div
                      className={`relative mb-3.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${c.bg} ring-1 ring-white/10 ${c.text} transition-shadow duration-300 group-hover:${c.glow}`}
                    >
                      <feature.icon size={17} />
                    </div>
                    <h3 className="relative mb-1.5 text-[14px] font-semibold tracking-tight text-white">
                      {feature.title}
                    </h3>
                    <p className="relative text-[12.5px] leading-relaxed text-white/50">
                      {feature.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── How it works ────────────────────────────────────────── */}
        <section className="relative px-4 py-20 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-4xl">
            <div className="mb-10 text-center sm:mb-14">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.15em] text-white/55">
                How it works
              </div>
              <h2 className="text-[22px] font-bold tracking-[-0.02em] sm:text-[28px]">
                Three steps to recover your item
              </h2>
              <p className="mt-2 text-[13px] text-white/45 sm:text-sm">Simple. Fast. Secure.</p>
            </div>

            <div className="relative grid gap-5 sm:grid-cols-3 sm:gap-6">
              {/* connecting line */}
              <div className="absolute left-[16.67%] right-[16.67%] top-9 hidden h-px bg-gradient-to-r from-transparent via-white/15 to-transparent sm:block" />

              {[
                {
                  title: "Sign in",
                  desc: "Use your @ds.study.iitm.ac.in Google account. Verified instantly.",
                  icon: Users,
                },
                {
                  title: "Report or search",
                  desc: "Post a lost or found item with photos. Or browse what's been reported.",
                  icon: Search,
                },
                {
                  title: "Connect & recover",
                  desc: "Message directly through the platform. Mark recovered to close the case.",
                  icon: CheckCircle2,
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="relative flex flex-col items-center rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center backdrop-blur-sm transition-all hover:border-white/[0.12] hover:bg-white/[0.035] sm:bg-transparent sm:p-0 sm:backdrop-blur-none sm:hover:bg-transparent"
                >
                  <div className="relative mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-2xl border border-white/[0.1] bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-md sm:bg-[#0a0a10]">
                    <item.icon size={22} className="text-white/70" />
                    <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-[11px] font-bold text-white shadow-[0_4px_12px_rgba(59,130,246,0.45)]">
                      {i + 1}
                    </div>
                  </div>
                  <h3 className="mb-1.5 text-[14px] font-semibold tracking-tight text-white">
                    {item.title}
                  </h3>
                  <p className="max-w-[28ch] text-[12.5px] leading-relaxed text-white/45">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Trust / Security ────────────────────────────────────── */}
        <section className="relative px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-blue-950/40 via-[#0a0a10]/60 to-violet-950/30 p-7 backdrop-blur-md sm:p-10">
              {/* inner glows */}
              <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-blue-500/15 blur-[80px]" />
              <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-violet-500/15 blur-[80px]" />

              <div className="relative grid gap-8 sm:grid-cols-[1.1fr_1fr] sm:gap-10">
                <div>
                  <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-blue-400/25 bg-blue-500/10 px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.15em] text-blue-300">
                    <Shield size={11} />
                    Security First
                  </div>
                  <h2 className="text-[20px] font-bold tracking-[-0.02em] sm:text-[24px]">
                    Built for trust, not just convenience
                  </h2>
                  <p className="mt-3 max-w-[42ch] text-[13px] leading-relaxed text-white/55 sm:text-[13.5px]">
                    Every user is a verified IITM DS student. Row-level security ensures you only
                    see what you&apos;re authorized to. No public listings, no anonymous messages.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: "Domain restricted", sub: "@ds.study.iitm.ac.in only" },
                    { label: "End-to-end verified", sub: "Google OAuth identity" },
                    { label: "Private messaging", sub: "Owner + finder only" },
                    { label: "Admin moderation", sub: "Abuse review & action" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 backdrop-blur-md transition-colors hover:border-white/[0.14] hover:bg-white/[0.055]"
                    >
                      <div className="mb-1 flex items-center gap-1.5">
                        <CheckCircle2 size={11} className="text-blue-400" />
                        <span className="text-[11.5px] font-semibold text-white/85">
                          {item.label}
                        </span>
                      </div>
                      <p className="text-[10.5px] leading-snug text-white/40">{item.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────── */}
        <section className="relative px-4 py-20 sm:px-6 sm:py-24">
          <div className="relative mx-auto max-w-2xl text-center">
            <div className="pointer-events-none absolute inset-x-0 -top-10 h-[300px] bg-[radial-gradient(ellipse_50%_60%_at_50%_50%,rgba(99,102,241,0.18),transparent_70%)]" />
            <h2 className="relative text-[22px] font-bold tracking-[-0.02em] sm:text-[28px]">
              Lost something? Found something?
            </h2>
            <p className="relative mx-auto mt-2.5 max-w-[44ch] text-[13.5px] text-white/50 sm:text-[14.5px]">
              Join your campus community on Findora. It only takes a minute.
            </p>
            <div className="relative mt-7">
              <Link
                href="/login"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl px-7 py-3.5 text-[13.5px] font-semibold text-white shadow-[0_8px_28px_rgba(59,130,246,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all hover:-translate-y-px hover:shadow-[0_12px_36px_rgba(59,130,246,0.55),inset_0_1px_0_rgba(255,255,255,0.25)]"
              >
                <span className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-violet-600" />
                <span className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />
                <span className="relative">Get started with Google</span>
                <ArrowRight
                  size={15}
                  className="relative transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>
            <p className="relative mt-4 text-[11.5px] text-white/30">
              Free to use. No account creation needed.
            </p>
          </div>
        </section>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <footer className="relative border-t border-white/[0.06] px-4 py-10 sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row sm:gap-4">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-md ring-1 ring-white/10">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-violet-600 opacity-80" />
                <Image
                  src="/favicon-96x96.png"
                  alt="Findora"
                  width={24}
                  height={24}
                  className="relative z-10"
                />
              </div>
              <span className="text-[13px] font-semibold text-white/80">Findora</span>
              <span className="hidden text-[11px] text-white/25 sm:inline-block">
                &middot; &copy; {new Date().getFullYear()}
              </span>
            </div>

            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-white/45">
              <Link href="/about" className="transition-colors hover:text-white">
                About
              </Link>
              <Link href="/privacy" className="transition-colors hover:text-white">
                Privacy
              </Link>
              <Link href="/terms" className="transition-colors hover:text-white">
                Terms
              </Link>
              <Link href="/contact" className="transition-colors hover:text-white">
                Contact
              </Link>
            </nav>

            <div className="flex items-center gap-1">
              {[
                {
                  href: "https://github.com/RohitPulamarasetty/",
                  label: "GitHub",
                  icon: SOCIAL_ICONS.github,
                },
                {
                  href: "https://www.linkedin.com/in/rohit-kumar-pulamarasetty/",
                  label: "LinkedIn",
                  icon: SOCIAL_ICONS.linkedin,
                },
                {
                  href: "https://x.com/RPulamarasetty",
                  label: "X (Twitter)",
                  icon: SOCIAL_ICONS.twitter,
                },
              ].map(({ href, label, icon }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[0.06] hover:text-white"
                >
                  {icon}
                </Link>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
