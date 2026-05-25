import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import { Providers } from "./providers";
import {
  siteConfig,
  absoluteUrl,
  JsonLd,
  organizationSchema,
  websiteSchema,
  webApplicationSchema,
} from "@/lib/seo";
import "./globals.css";

// Analytics IDs — sourced from env so they never need to be hard-coded in
// source files. Both vars are NEXT_PUBLIC_* (safe to expose to the browser).
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;

// ── Typography ────────────────────────────────────────────────────────────────
// Body + Display font (UI_UX_GUIDELINES §3 — Font Stack)
// Plus Jakarta Sans is a strong, professional alternative to Cal Sans.
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

// Monospace font for IDs, timestamps, code (UI_UX_GUIDELINES §3)
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

// ── Metadata ──────────────────────────────────────────────────────────────────
// Page-specific titles fill the `%s` template; the root default applies to
// pages that don't export their own title.
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.fullName,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: Array.from(siteConfig.keywords),
  authors: [{ name: siteConfig.author.name, url: siteConfig.author.url }],
  creator: siteConfig.author.name,
  publisher: siteConfig.publisher,
  category: "Education",
  classification: "Campus Community Platform",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  referrer: "strict-origin-when-cross-origin",
  alternates: {
    canonical: siteConfig.url,
  },
  // Public pages: allow full indexing. Routes inside (app) and (auth)
  // override this with noindex in their own layout.tsx — those private
  // campus surfaces should never appear in search results.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    title: siteConfig.fullName,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: [
      {
        url: absoluteUrl(siteConfig.ogImage.path),
        width: siteConfig.ogImage.width,
        height: siteConfig.ogImage.height,
        alt: siteConfig.ogImage.alt,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.fullName,
    description: siteConfig.description,
    site: siteConfig.social.twitter,
    creator: siteConfig.social.twitter,
    images: [
      {
        url: absoluteUrl(siteConfig.ogImage.path),
        alt: siteConfig.ogImage.alt,
        width: siteConfig.ogImage.width,
        height: siteConfig.ogImage.height,
      },
    ],
  },
  icons: {
    // Order matters — Next.js emits these as <link rel="icon"> tags in this
    // order. Modern browsers walk the list and pick the first they support.
    // 1) SVG (scalable, theme-aware, sharp on every DPR) — Chrome/Firefox/Safari
    // 2) 96×96 PNG — covers older Chromium + tab-group thumbnails
    // 3) .ico — universal fallback (IE/legacy)
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
    ],
    // iOS home-screen icon (also used by macOS Safari pinned tabs).
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    // Legacy IE shortcut — points at the .ico for maximum compatibility.
    shortcut: ["/favicon.ico"],
  },
  manifest: "/site.webmanifest",
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    ...(siteConfig.verification.bing
      ? { other: { "msvalidate.01": siteConfig.verification.bing } }
      : {}),
  },
};

// ── Viewport ──────────────────────────────────────────────────────────────────
// Removed maximumScale=1 (accessibility/Lighthouse): users must be able to zoom.
// iOS form-zoom is now handled by 16px+ font-size on inputs in globals.css.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: siteConfig.themeColor.light },
    { media: "(prefers-color-scheme: dark)", color: siteConfig.themeColor.dark },
  ],
  colorScheme: "light dark",
};

// ── Root Layout ───────────────────────────────────────────────────────────────
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Default to `dark` so guests / first paint of public + auth routes
    // never flash light styles before any JS runs. ThemeProvider is mounted
    // per route group (see `(public)/layout.tsx`, `(auth)/layout.tsx`,
    // `(app)/layout.tsx`) — never at the root — so the authenticated user's
    // localStorage preference cannot leak into public/auth surfaces after
    // sign-out. The authenticated (app) ThemeProvider swaps this class to
    // the user's preference synchronously via its inline script before paint.
    // suppressHydrationWarning is required for next-themes class injection.
    <html lang={siteConfig.language} className="dark" suppressHydrationWarning>
      <head>
        {/* Site-wide JSON-LD: Organization, WebSite, WebApplication */}
        <JsonLd data={[organizationSchema(), websiteSchema(), webApplicationSchema()]} />
      </head>
      <body
        className={` ${plusJakartaSans.variable} ${jetbrainsMono.variable} font-body antialiased`}
      >
        <Providers>{children}</Providers>
        {/* ── Vercel telemetry ──────────────────────────────────────────────
            Both are zero-cost no-ops outside Vercel deployments (the bundled
            script self-disables when window.location.host doesn't match a
            Vercel-hosted origin), so they're safe to keep in local dev.
            Placed outside <Providers> — they don't need theme or query
            context, and rendering them as siblings avoids any risk of
            them re-running on provider state changes. */}
        <Analytics />
        <SpeedInsights />

        {/* ── Google Analytics 4 ─────────────────────────────────────────────
            Two-script manual pattern (canonical GA4 setup):
              1. ga-loader  — async-loads gtag.js from Google's CDN
              2. ga-init    — initialises window.dataLayer and calls gtag('config')

            Why manual instead of @next/third-parties/google:
            • The third-party wrapper wraps gtag internally in a way that can
              suppress the initial page_view hit in App Router, so no data shows
              in GA4 Realtime even though the script appears in the page source.
            • The manual pattern matches GA4's own "Add Google Analytics" snippet
              exactly, so gtag(), window.dataLayer, and the config call all exist
              in the order GA4 expects them.

            Both scripts use strategy="afterInteractive" — they run after React
            hydration, preventing any server/client mismatch. The unique `id`
            props tell Next.js's Script manager to inject each tag only once,
            even across client-side navigations.

            Skipped entirely when NEXT_PUBLIC_GA_ID is unset (local dev). */}
        {GA_ID && (
          <>
            {/* 1️⃣  Load gtag.js library from Google's CDN */}
            <Script
              id="ga-loader"
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            />
            {/* 2️⃣  Initialise dataLayer and send the config hit */}
            <Script
              id="ga-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_ID}');
                `,
              }}
            />
          </>
        )}

        {/* ── Microsoft Clarity ─────────────────────────────────────────────
            Injected once at the root layout so every page is covered.
            strategy="afterInteractive" defers execution until after hydration,
            preventing any risk of SSR/client mismatch. Skipped when
            NEXT_PUBLIC_CLARITY_ID is unset. */}
        {CLARITY_ID && (
          <Script
            id="microsoft-clarity"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                })(window,document,"clarity","script","${CLARITY_ID}");
              `,
            }}
          />
        )}
      </body>
    </html>
  );
}
