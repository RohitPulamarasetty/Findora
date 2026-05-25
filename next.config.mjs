/** @type {import('next').NextConfig} */

// ── Content Security Policy ────────────────────────────────────────────────────
//
// Built as a structured object (directive → array of allowed values) so the
// final header string is 100% explicit — no regex, no template-literal
// whitespace collapsing, no silent truncation risk.
//
// SECURITY NOTE (audit 0013):
//   • 'unsafe-eval'  — required only by Next.js HMR in dev. Dropped in prod,
//                      eliminating the easiest XSS payload-eval vector.
//   • 'unsafe-inline' on script-src — pending a per-request nonce migration.
//     Next.js App Router emits inline <script> blocks for hydration data and
//     next-themes' color-scheme bootstrap; nonce-based CSP would require
//     threading a nonce through every server component. Tracked as follow-up.
//   • Analytics domains — GA4 (googletagmanager + google-analytics) and
//     Microsoft Clarity (*.clarity.ms) are whitelisted in the minimum required
//     directives only (script-src, connect-src, img-src). No extra permissions
//     are granted.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : "";
const isDev = process.env.NODE_ENV !== "production";

// Each key is a CSP directive name; each value is the ordered list of sources.
// Directives with an empty array emit as a flag-only directive (e.g.
// "upgrade-insecure-requests" which takes no value).
const CSP_DIRECTIVES = {
  "default-src": ["'self'"],

  // ── Scripts ──────────────────────────────────────────────────────────────
  // 'unsafe-eval' only in dev (Next.js HMR + React Fast Refresh require it).
  // 'unsafe-inline' required for Next.js hydration chunks & next-themes.
  // googletagmanager.com  — GA4 loader (gtag.js)
  // clarity.ms            — Microsoft Clarity loader
  "script-src": [
    "'self'",
    ...(isDev ? ["'unsafe-eval'"] : []),
    "'unsafe-inline'",
    "https://checkout.razorpay.com",
    "https://www.googletagmanager.com",
    "https://www.clarity.ms",
    "https://scripts.clarity.ms",
  ],

  // ── Styles ───────────────────────────────────────────────────────────────
  "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],

  // ── Fonts ────────────────────────────────────────────────────────────────
  "font-src": ["'self'", "https://fonts.gstatic.com"],

  // ── Images ───────────────────────────────────────────────────────────────
  // google-analytics.com  — GA4 img-beacon fallback (sendBeacon or img pixel)
  // googletagmanager.com  — GTM pixel (defence-in-depth)
  "img-src": [
    "'self'",
    "blob:",
    "data:",
    "https://*.supabase.co",
    "https://*.supabase.in",
    "https://*.razorpay.com",
    // Explicit Supabase project host (e.g. storage CDN origin)
    ...(supabaseHost ? [`https://${supabaseHost}`] : []),
    "https://www.google-analytics.com",
    "https://www.googletagmanager.com",
    // Google OAuth profile photos
    "https://lh3.googleusercontent.com",
  ],

  // ── Fetch / XHR / Beacon / WebSocket ─────────────────────────────────────
  // google-analytics.com        — GA4 g/collect endpoint
  // region1.google-analytics.com — GA4 regional collect endpoint (EU traffic)
  // googletagmanager.com        — GTM secondary config fetches
  // *.clarity.ms                — Clarity data collection (d. / e. subdomains)
  "connect-src": [
    "'self'",
    "https://*.supabase.co",
    "https://*.supabase.in",
    "wss://*.supabase.co",
    "wss://*.supabase.in",
    "https://accounts.google.com",
    "https://api.razorpay.com",
    "https://lumberjack.razorpay.com",
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
    "https://region1.google-analytics.com",
    "https://*.clarity.ms",
    "https://scripts.clarity.ms",
  ],

  // ── Frames ───────────────────────────────────────────────────────────────
  "frame-src": [
    "'self'",
    "https://accounts.google.com",
    "https://api.razorpay.com",
    "https://checkout.razorpay.com",
  ],

  // ── Lockdown directives ───────────────────────────────────────────────────
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
  // Flag directive — no value list
  "upgrade-insecure-requests": [],
};

// Serialise: "directive-name val1 val2 val3; next-directive ..."
// Directives with no values emit as bare tokens (e.g. upgrade-insecure-requests).
const ContentSecurityPolicy = Object.entries(CSP_DIRECTIVES)
  .map(([directive, sources]) =>
    sources.length > 0 ? `${directive} ${sources.join(" ")}` : directive,
  )
  .join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don't advertise the framework — small fingerprint reduction.
  poweredByHeader: false,

  // React strict mode in dev catches more bugs; harmless in prod.
  reactStrictMode: true,

  // ── Security Headers ──────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // Prevent MIME-type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Control referrer information
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // HTTPS enforcement (1 year, include subdomains, preload-ready)
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          // Restrict browser feature access
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          // Cross-origin isolation (defence in depth — limits side-channel
          // attacks and tightens what cross-origin docs can do to us).
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-site" },
          // Content Security Policy
          { key: "Content-Security-Policy", value: ContentSecurityPolicy },
        ],
      },
    ];
  },

  // ── Image Optimization ────────────────────────────────────────
  images: {
    remotePatterns: [
      // Supabase Storage CDN
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.in",
        pathname: "/storage/v1/object/public/**",
      },
      // Google profile avatars (OAuth sign-in)
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
    // Convert uploaded images to WebP for storage efficiency
    formats: ["image/webp"],
  },

  // ── Experimental ─────────────────────────────────────────────
  experimental: {
    // Enable server actions (used in form mutations)
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

// ── Bundle analyzer (opt-in via `ANALYZE=true npm run build`) ────────────────
// Wrapped dynamically so it stays a dev-time tool — the package is NOT a
// hard dependency. Install with `npm i -D @next/bundle-analyzer` to enable.
async function withOptionalAnalyzer(config) {
  if (process.env.ANALYZE !== "true") return config;
  try {
    const dynamicImport = new Function("m", "return import(m)");
    const mod = await dynamicImport("@next/bundle-analyzer");
    const withBundleAnalyzer = mod.default({ enabled: true });
    return withBundleAnalyzer(config);
  } catch {
    // Package not installed — return config unchanged.
    return config;
  }
}

export default await withOptionalAnalyzer(nextConfig);
