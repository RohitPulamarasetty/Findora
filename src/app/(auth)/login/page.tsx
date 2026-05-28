import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Shield, Zap, Lock, Search, MapPin } from "lucide-react";
import { FindoraLogo } from "@/components/shared/findora-logo";
import { GoogleSignInButton } from "@/components/features/auth/google-sign-in-button";

export const metadata: Metadata = {
  title: "Sign In",
};

const ERROR_MESSAGES: Record<string, string> = {
  domain_not_allowed:
    "Only IITM student email addresses (@ds.study.iitm.ac.in, @es.study.iitm.ac.in, @study.iitm.ac.in) are allowed.",
  account_banned: "Your account has been suspended. Contact an admin.",
  auth_failed: "Sign-in failed. Please try again.",
  missing_code: "Invalid sign-in link. Please try again.",
  no_email: "Could not retrieve your email. Please try again.",
};

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? "Something went wrong.") : null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg-base">
      {/* ── Ambient backdrop ──────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0">
        {/* Top brand glow */}
        <div className="absolute left-1/2 top-0 h-[520px] w-[640px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-brand-500/20 blur-[110px] dark:bg-brand-500/15" />
        {/* Bottom-right violet wash */}
        <div className="bg-violet-500/12 dark:bg-violet-500/8 absolute -bottom-32 right-0 h-[360px] w-[440px] rounded-full blur-[90px]" />
        {/* Bottom-left subtle */}
        <div className="bg-brand-400/8 dark:bg-brand-400/6 absolute -bottom-24 left-0 h-[320px] w-[400px] rounded-full blur-[80px]" />
      </div>

      {/* ── Back link ─────────────────────────────────────────────── */}
      <Link
        href="/"
        className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-text-muted-fg transition-colors hover:bg-bg-muted-surface hover:text-text-base sm:left-6 sm:top-6"
      >
        <ArrowLeft size={14} />
        Back
      </Link>

      {/* ── Main content ──────────────────────────────────────────── */}
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Brand mark */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center overflow-hidden rounded-[20px] bg-bg-subtle shadow-[0_8px_28px_rgba(65,112,255,0.32)] ring-1 ring-border-default">
              <FindoraLogo size={56} />
            </div>
            <h1 className="text-[26px] font-bold tracking-[-0.025em] text-text-base">
              Welcome to Findora
            </h1>
            <p className="mt-1.5 max-w-[300px] text-[13.5px] leading-relaxed text-text-secondary">
              The campus lost &amp; found platform built for IITM online degree students.
            </p>
          </div>

          {/* Error */}
          {errorMessage && (
            <div
              role="alert"
              className="bg-red-500/8 mb-4 flex items-start gap-2.5 rounded-2xl border border-red-500/25 px-4 py-3 text-[13px] text-red-600 dark:text-red-400"
            >
              <Shield size={14} className="mt-0.5 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}

          {/* Sign-in card */}
          <div className="overflow-hidden rounded-3xl border border-border-default bg-bg-subtle shadow-[0_8px_32px_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.04)] backdrop-blur-2xl dark:shadow-[0_8px_36px_rgba(0,0,0,0.5),0_2px_10px_rgba(0,0,0,0.3)]">
            {/* Inner gradient accent */}
            <div className="relative">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />

              <div className="p-6 sm:p-7">
                <h2 className="mb-1 text-[15px] font-bold tracking-tight text-text-base">
                  Sign in to continue
                </h2>
                <p className="mb-6 text-[13px] text-text-muted-fg">
                  Use your IITM student Google account to access the platform.
                </p>

                <GoogleSignInButton />

                <div className="mt-5 flex items-center gap-2">
                  <div className="h-px flex-1 bg-border-default" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted-fg">
                    Restricted access
                  </span>
                  <div className="h-px flex-1 bg-border-default" />
                </div>

                <p className="mt-4 text-center text-[12px] leading-relaxed text-text-muted-fg">
                  IITM student accounts only
                  <br />
                  <span className="text-[10.5px] text-text-muted-fg/70">
                    @ds / @es / @study .iitm.ac.in
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Trust signals */}
          <div className="mt-5 grid grid-cols-3 gap-2.5">
            {[
              { icon: Shield, label: "Verified users", sub: "Campus only" },
              { icon: Lock, label: "Secure", sub: "End-to-end" },
              { icon: Zap, label: "Realtime", sub: "Instant chat" },
            ].map(({ icon: Icon, label, sub }, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1 rounded-2xl border border-border-default bg-bg-subtle py-3.5"
              >
                <Icon size={14} className="text-brand-500 dark:text-brand-400" />
                <span className="text-center text-[10.5px] font-semibold text-text-base">
                  {label}
                </span>
                <span className="text-center text-[9px] font-medium text-text-muted-fg">{sub}</span>
              </div>
            ))}
          </div>

          {/* Feature badges below */}
          <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-text-muted-fg">
            <span className="inline-flex items-center gap-1">
              <Search size={11} />
              Smart search
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin size={11} />
              Location-aware
            </span>
          </div>

          <p className="mt-6 text-center text-[11px] text-text-muted-fg">
            &copy; {new Date().getFullYear()} Findora &middot; IIT Madras
          </p>
        </div>
      </div>
    </div>
  );
}
