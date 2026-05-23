/** @type {import('next').NextConfig} */

// Content Security Policy
// Supabase URL is read at build time so the CDN URL ends up in the header.
//
// SECURITY NOTE (audit 0013):
//   - 'unsafe-eval' is required only by Next.js HMR in dev. We drop it in
//     production, which eliminates the easiest XSS payload-eval vector.
//   - 'unsafe-inline' on script-src remains pending a per-request nonce
//     migration. Next 14 App Router still emits inline <script> blocks for
//     hydration data and next-themes's color-scheme bootstrap; nonce-based
//     CSP requires generating + passing the nonce through every server
//     component render. Tracked as a follow-up — not in scope for this fix.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : "";
const isProd = process.env.NODE_ENV === "production";

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' ${isProd ? "" : "'unsafe-eval'"} 'unsafe-inline' https://checkout.razorpay.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' blob: data: https://*.supabase.co https://*.supabase.in https://*.razorpay.com ${supabaseHost ? `https://${supabaseHost}` : ""};
  connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in https://accounts.google.com https://api.razorpay.com https://lumberjack.razorpay.com;
  frame-src 'self' https://accounts.google.com https://api.razorpay.com https://checkout.razorpay.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

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
