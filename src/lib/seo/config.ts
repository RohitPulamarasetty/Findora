/**
 * Centralized SEO / site identity configuration.
 *
 * Single source of truth for: production URL, brand strings, social handles,
 * default descriptions, OG image paths, contact info. Used by metadata helpers,
 * JSON-LD schema generators, robots.ts, sitemap.ts, opengraph-image.tsx.
 *
 * Set NEXT_PUBLIC_APP_URL in production (Vercel env) to your real domain
 * (e.g. https://findora.app). Without it, OG image URLs and canonicals fall
 * back to localhost — which breaks social previews everywhere.
 */

const FALLBACK_URL = "http://localhost:3000";

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

const RAW_APP_URL = process.env.NEXT_PUBLIC_APP_URL || FALLBACK_URL;

export const siteConfig = {
  // ── Identity ────────────────────────────────────────────────────────
  name: "Findora",
  shortName: "Findora",
  fullName: "Findora — Campus Community Network",
  tagline: "Trusted campus network for verified students",

  // ── URLs ────────────────────────────────────────────────────────────
  url: normalizeUrl(RAW_APP_URL),

  // ── Descriptions ────────────────────────────────────────────────────
  description:
    "Findora is a private, verified campus network for IITM DS students — connect with peers, recover lost items, and access trusted community tools built for your college ecosystem.",
  shortDescription:
    "Private, verified campus network for IITM DS students. Trust, utility, and peer-to-peer connection.",

  // ── Keywords (used selectively; modern SEO mostly ignores) ──────────
  keywords: [
    "Findora",
    "Findora campus network",
    "Findora IITM",
    "Findora IIT Madras",
    "campus community app",
    "student utility platform",
    "campus lost and found",
    "IITM DS student platform",
    "verified student network",
    "peer-to-peer campus app",
  ],

  // ── Branding ────────────────────────────────────────────────────────
  themeColor: {
    light: "#F9F8F5",
    dark: "#08080c",
  },
  brandColor: "#3b82f6", // brand-500 (blue) — used for manifest theme_color

  // ── Locale / language ───────────────────────────────────────────────
  locale: "en_US",
  language: "en",

  // ── Author / publisher ──────────────────────────────────────────────
  author: {
    name: "Rohit Pulamarasetty",
    url: "https://github.com/RohitPulamarasetty",
    email: "rohitpulamarasetty@gmail.com",
  },
  publisher: "Findora",

  // ── Social handles ──────────────────────────────────────────────────
  social: {
    twitter: "@RPulamarasetty",
    twitterUrl: "https://x.com/RPulamarasetty",
    github: "https://github.com/RohitPulamarasetty",
    githubRepo: "https://github.com/RohitPulamarasetty/Findora",
    linkedin: "https://www.linkedin.com/in/rohit-kumar-pulamarasetty/",
  },

  // ── OG image paths (resolved against metadataBase) ──────────────────
  ogImage: {
    path: "/opengraph-image", // dynamic next/og route, resolves to /opengraph-image.png
    width: 1200,
    height: 630,
    alt: "Findora — Campus Community Network for IITM DS Students",
  },

  // ── Verification (set in env when ready) ────────────────────────────
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
    bing: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || "",
  },
} as const;

export type SiteConfig = typeof siteConfig;

/**
 * Absolute URL helper — joins a path against the configured siteConfig.url.
 * Use this anywhere an absolute URL is required (OG, JSON-LD, canonicals).
 */
export function absoluteUrl(path = "/"): string {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${siteConfig.url}${path}`;
}
