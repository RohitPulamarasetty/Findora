/**
 * Centralized SEO / site identity configuration.
 *
 * Single source of truth for: production URL, brand strings, social handles,
 * default descriptions, OG image paths, contact info. Used by metadata helpers,
 * JSON-LD schema generators, robots.ts, sitemap.ts.
 *
 * Set NEXT_PUBLIC_APP_URL in production (Vercel env) to your real domain
 * (e.g. https://findora.live). Without it, OG image URLs and canonicals fall
 * back to localhost — which breaks social previews everywhere.
 */

// Production canonical origin. Used as the fallback when NEXT_PUBLIC_APP_URL is
// not present at build time — critical for Vercel deployments where the env var
// may not be set. Without this, sitemap.xml and robots.txt would emit
// `http://localhost:3000/...` URLs and Google Search Console reports
// "Sitemap could not be read".
// Local dev still gets http://localhost:3000 because .env.local sets
// NEXT_PUBLIC_APP_URL explicitly, which takes precedence.
const FALLBACK_URL = "https://findora.live";

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

const RAW_APP_URL = process.env.NEXT_PUBLIC_APP_URL || FALLBACK_URL;

export const siteConfig = {
  // ── Identity ────────────────────────────────────────────────────────
  // Findora's core identity is a TRUST-FIRST CAMPUS LOST & FOUND PLATFORM.
  // All public-facing strings lead with that positioning. "Community" is
  // secondary context, never the headline.
  name: "Findora",
  shortName: "Findora",
  fullName: "Findora — IITM DS Lost & Found Platform",
  tagline: "Find what's lost. Return what's found.",

  // ── URLs ────────────────────────────────────────────────────────────
  url: normalizeUrl(RAW_APP_URL),

  // ── Descriptions ────────────────────────────────────────────────────
  description:
    "Findora is a secure IITM DS campus lost and found platform helping students recover lost items quickly through verified reporting and matching.",
  shortDescription: "Secure campus lost and found platform for IITM DS students.",

  // ── Keywords (used selectively; modern SEO mostly ignores) ──────────
  keywords: [
    "Findora",
    "campus lost and found",
    "lost and found platform",
    "IITM lost and found",
    "IIT Madras lost and found",
    "student lost and found app",
    "campus recovery platform",
    "verified student platform",
    "Findora IITM",
    "campus utility app",
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
  // Static OG asset shipped at /public/og_img.png. Served by the Vercel CDN
  // with long-lived caching — no runtime cost. Aspect ratio is ~1.9:1
  // which matches the OG 1.91:1 spec, so social platforms render it
  // without cropping the headline or trust signals.
  ogImage: {
    path: "/og_img.png",
    width: 1731,
    height: 909,
    alt: "Findora — Find what's lost. Return what's found. The trusted campus lost & found platform for IITM DS students.",
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
