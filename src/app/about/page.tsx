import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Code2,
  GraduationCap,
  Palette,
  Lightbulb,
  Quote,
} from "lucide-react";
import { SupportCTA } from "@/components/shared/support-cta";

export const metadata: Metadata = {
  title: "About",
  description: "The story behind Findora — built for students, by students.",
};

const SOCIAL_ICONS = {
  github: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.11.79-.25.79-.56v-1.97c-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.8 1.18 1.83 1.18 3.09 0 4.43-2.69 5.4-5.26 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.36V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .78 0 1.74v20.52C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.74V1.74C24 .78 23.2 0 22.22 0Z" />
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  ),
  portfolio: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
};

const SOCIAL_LINKS = [
  { href: "https://github.com/", label: "GitHub", icon: SOCIAL_ICONS.github },
  { href: "https://linkedin.com/", label: "LinkedIn", icon: SOCIAL_ICONS.linkedin },
  { href: "https://x.com/", label: "X (Twitter)", icon: SOCIAL_ICONS.twitter },
  { href: "https://example.com/", label: "Portfolio", icon: SOCIAL_ICONS.portfolio },
];

export default function AboutPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#08080c] text-white">
      {/* ── Ambient background ────────────────────────────────────── */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage: "radial-gradient(rgb(255 255 255 / 0.08) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute left-1/2 top-0 h-[700px] w-[900px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-blue-600/20 blur-[140px]" />
        <div className="absolute right-[-10%] top-[35%] h-[480px] w-[480px] rounded-full bg-violet-600/15 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10">
        {/* ── Top bar ───────────────────────────────────────────── */}
        <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/[0.06] bg-[#08080c]/70 backdrop-blur-2xl">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link
              href="/"
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-white/65 transition-colors hover:text-white"
            >
              <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
              Back
            </Link>
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
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-sm font-semibold text-black shadow-[0_4px_14px_rgba(255,255,255,0.15)] transition-all hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(255,255,255,0.25)]"
            >
              Open app
              <ArrowRight size={13} />
            </Link>
          </div>
        </nav>

        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="relative px-4 pb-14 pt-28 sm:px-6 sm:pb-20 sm:pt-32">
          <div className="relative mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-white/70 backdrop-blur-md">
              <Sparkles size={11} className="text-blue-400" />
              <span className="tracking-wide">The story behind Findora</span>
            </div>
            <h1 className="mx-auto max-w-[20ch] text-[32px] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[42px] sm:leading-[1.05] md:text-[50px]">
              Built for students,{" "}
              <span className="bg-gradient-to-br from-blue-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                by students
              </span>
              .
            </h1>
            <p className="mx-auto mt-5 max-w-[54ch] text-[14.5px] leading-relaxed text-white/55 sm:text-[15.5px]">
              Findora is a modern platform focused on building useful tools and products for
              students and developers. It started with a simple campus problem — and the belief that
              everyday software for students can feel just as polished as anything else you use.
            </p>
          </div>
        </section>

        {/* ── Founder card ─────────────────────────────────────── */}
        <section className="relative px-4 pb-16 sm:px-6 sm:pb-20">
          <div className="mx-auto max-w-3xl">
            <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.015] p-6 backdrop-blur-md sm:p-9">
              {/* inner glows */}
              <div className="pointer-events-none absolute -left-16 -top-16 h-60 w-60 rounded-full bg-blue-500/15 blur-[80px]" />
              <div className="pointer-events-none absolute -bottom-16 -right-16 h-60 w-60 rounded-full bg-violet-500/15 blur-[80px]" />

              <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:gap-8 sm:text-left">
                {/* Profile avatar with gradient ring */}
                <div className="relative shrink-0">
                  <div className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-blue-500 via-violet-500 to-cyan-400 opacity-70 blur-md" />
                  <div className="relative h-[88px] w-[88px] rounded-full bg-gradient-to-br from-blue-500 via-violet-600 to-cyan-500 p-[2px]">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-[#0c0c14]">
                      <span className="bg-gradient-to-br from-blue-300 to-violet-300 bg-clip-text text-[26px] font-bold tracking-tight text-transparent">
                        RP
                      </span>
                    </div>
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-blue-400/25 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-blue-300">
                    Creator of Findora
                  </div>
                  <h2 className="text-[22px] font-bold tracking-[-0.02em] sm:text-[26px]">
                    Rohit Pulamarasetty
                  </h2>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-[12.5px] text-white/55">
                    <GraduationCap size={13} className="text-white/45" />
                    Engineering Student at IIT Madras
                  </p>
                  <p className="mt-4 max-w-[52ch] text-[13.5px] leading-relaxed text-white/60">
                    Rohit builds small, useful products with a focus on UI/UX, design detail, and
                    solving real student problems. Findora is part of an ongoing interest in making
                    campus life — communication, recovery, coordination — feel a little more modern.
                  </p>

                  {/* Interest chips */}
                  <div className="mt-5 flex flex-wrap justify-center gap-1.5 sm:justify-start">
                    {[
                      { label: "Product engineering", Icon: Code2 },
                      { label: "UI / UX design", Icon: Palette },
                      { label: "Student tools", Icon: Lightbulb },
                    ].map(({ label, Icon }) => (
                      <span
                        key={label}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-white/65 backdrop-blur-sm"
                      >
                        <Icon size={11} className="text-blue-300" />
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Why Findora exists ───────────────────────────────── */}
        <section className="relative px-4 pb-16 sm:px-6 sm:pb-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 text-center sm:mb-12">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.15em] text-white/55">
                Why Findora exists
              </div>
              <h2 className="text-[22px] font-bold tracking-[-0.02em] sm:text-[28px]">
                A small problem worth solving well
              </h2>
              <p className="mx-auto mt-2 max-w-[48ch] text-[13px] text-white/45 sm:text-sm">
                Lost items on campus rarely come back — not because no one finds them, but because
                the way we recover them is fragmented.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              {[
                {
                  title: "Things get lost — often",
                  desc: "Wallets, ID cards, headphones, keys. Hostel, mess, library, classrooms — there's no single place to ask.",
                  accent: "from-blue-500/20 to-blue-500/5",
                  ring: "ring-blue-400/30",
                  dot: "bg-blue-400",
                },
                {
                  title: "Existing systems are outdated",
                  desc: "Notice boards and WhatsApp groups disappear into the noise. Important reports get buried in minutes.",
                  accent: "from-violet-500/20 to-violet-500/5",
                  ring: "ring-violet-400/30",
                  dot: "bg-violet-400",
                },
                {
                  title: "Trust matters",
                  desc: "Sharing a phone number on a public list is uncomfortable. Verified identity and private messaging fix that.",
                  accent: "from-emerald-500/20 to-emerald-500/5",
                  ring: "ring-emerald-400/30",
                  dot: "bg-emerald-400",
                },
                {
                  title: "Simple beats clever",
                  desc: "Findora doesn't try to do everything. It does one thing — connect owners and finders — quickly and cleanly.",
                  accent: "from-cyan-500/20 to-cyan-500/5",
                  ring: "ring-cyan-400/30",
                  dot: "bg-cyan-400",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.14] hover:bg-white/[0.045]"
                >
                  <div
                    className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${card.accent} opacity-60 blur-2xl transition-opacity duration-300 group-hover:opacity-100`}
                  />
                  <div className="relative mb-2.5 flex items-center gap-2">
                    <span
                      className={`flex h-1.5 w-1.5 rounded-full ${card.dot} ring-4 ${card.ring}`}
                    />
                    <h3 className="text-[14px] font-semibold tracking-tight text-white">
                      {card.title}
                    </h3>
                  </div>
                  <p className="relative text-[12.5px] leading-relaxed text-white/55">
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Special thanks ──────────────────────────────────── */}
        <section className="relative px-4 pb-16 sm:px-6 sm:pb-20">
          <div className="mx-auto max-w-2xl">
            <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-rose-500/[0.06] via-white/[0.025] to-violet-500/[0.06] p-6 backdrop-blur-md sm:p-8">
              <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-rose-400/10 blur-[60px]" />
              <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-violet-400/10 blur-[60px]" />
              <div className="relative flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.1] bg-gradient-to-br from-rose-500/20 to-violet-500/20 text-rose-200">
                  <Quote size={15} />
                </div>
                <div>
                  <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.15em] text-white/45">
                    Special thanks
                  </div>
                  <p className="text-[14px] font-medium leading-relaxed text-white/85 sm:text-[15px]">
                    Special thanks to{" "}
                    <span className="bg-gradient-to-br from-rose-300 to-violet-300 bg-clip-text font-semibold text-transparent">
                      Zaira
                    </span>{" "}
                    for helping and supporting the development of Findora.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Support Findora ─────────────────────────────────── */}
        <section className="relative px-4 pb-16 sm:px-6 sm:pb-20">
          <div className="mx-auto max-w-3xl">
            <SupportCTA variant="marketing" />
          </div>
        </section>

        {/* ── Social links ────────────────────────────────────── */}
        <section className="relative px-4 pb-16 sm:px-6 sm:pb-20">
          <div className="mx-auto max-w-3xl">
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white/40">
                Connect
              </p>
              <div className="flex items-center gap-2">
                {SOCIAL_LINKS.map(({ href, label, icon }) => (
                  <Link
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/55 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.18] hover:bg-white/[0.07] hover:text-white hover:shadow-[0_8px_24px_rgba(59,130,246,0.2)]"
                  >
                    {icon}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer CTA ──────────────────────────────────────── */}
        <section className="relative px-4 pb-24 sm:px-6 sm:pb-28">
          <div className="relative mx-auto max-w-2xl text-center">
            <div className="pointer-events-none absolute inset-x-0 -top-10 h-[280px] bg-[radial-gradient(ellipse_50%_60%_at_50%_50%,rgba(99,102,241,0.18),transparent_70%)]" />
            <h3 className="relative text-[22px] font-bold tracking-[-0.02em] sm:text-[26px]">
              Help make campus recovery smarter.
            </h3>
            <p className="relative mx-auto mt-2.5 max-w-[44ch] text-[13.5px] text-white/50">
              Sign in with your IITM DS account to start using Findora.
            </p>
            <div className="relative mt-7 flex flex-col items-center justify-center gap-2.5 sm:flex-row sm:gap-3">
              <Link
                href="/login"
                className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-7 py-3.5 text-[13.5px] font-semibold text-white shadow-[0_8px_28px_rgba(59,130,246,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all hover:-translate-y-px hover:shadow-[0_12px_36px_rgba(59,130,246,0.55),inset_0_1px_0_rgba(255,255,255,0.25)] sm:w-auto"
              >
                <span className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-violet-600" />
                <span className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />
                <span className="relative">Open Dashboard</span>
                <ArrowRight
                  size={15}
                  className="relative transition-transform group-hover:translate-x-0.5"
                />
              </Link>
              <Link
                href="/"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-7 py-3.5 text-[13.5px] font-semibold text-white/80 backdrop-blur-md transition-all hover:border-white/[0.18] hover:bg-white/[0.06] hover:text-white sm:w-auto"
              >
                Return Home
              </Link>
            </div>
          </div>
        </section>

        {/* ── Footer ──────────────────────────────────────────── */}
        <footer className="relative border-t border-white/[0.06] px-4 py-8 sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
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
            <p className="text-center text-[11.5px] text-white/40">
              Designed &amp; Developed by{" "}
              <span className="font-medium text-white/70">Rohit Pulamarasetty</span>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
