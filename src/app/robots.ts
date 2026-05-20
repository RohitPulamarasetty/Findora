import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";

/**
 * robots.txt — explicitly disallows every authenticated/private surface so
 * crawlers never even try to index campus-internal content (defense-in-depth
 * on top of the per-route noindex metadata in (app)/layout.tsx).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/privacy", "/terms", "/contact"],
        disallow: [
          "/home",
          "/search",
          "/report",
          "/items",
          "/items/",
          "/messages",
          "/messages/",
          "/profile",
          "/profile/",
          "/cases",
          "/cases/",
          "/settings",
          "/settings/",
          "/admin",
          "/admin/",
          "/login",
          "/api/",
          "/auth/",
          "/_next/",
          "/opengraph-image",
        ],
      },
      {
        // Block aggressive AI/data scrapers — campus content is private.
        userAgent: ["GPTBot", "CCBot", "ClaudeBot", "Google-Extended", "anthropic-ai"],
        disallow: "/",
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
