/** @type {import('next').NextConfig} */

// Content Security Policy
// Supabase URL is read at build time so the CDN URL ends up in the header.
// Tighten script-src to 'nonce-based' before production if possible.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : "";

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com;
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
  // ── Security Headers ──────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Prevent MIME-type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Control referrer information
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // HTTPS enforcement (1 year, include subdomains)
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          // Restrict browser feature access
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          // Content Security Policy
          {
            key: "Content-Security-Policy",
            value: ContentSecurityPolicy,
          },
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

export default nextConfig;
