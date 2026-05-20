import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
  robots: {
    index: true,
    follow: true,
    nocache: false,
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
  ...(siteConfig.verification.google || siteConfig.verification.bing
    ? {
        verification: {
          ...(siteConfig.verification.google ? { google: siteConfig.verification.google } : {}),
          ...(siteConfig.verification.bing
            ? { other: { "msvalidate.01": siteConfig.verification.bing } }
            : {}),
        },
      }
    : {}),
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
    // suppressHydrationWarning prevents next-themes class injection mismatch
    <html lang={siteConfig.language} suppressHydrationWarning>
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
      </body>
    </html>
  );
}
