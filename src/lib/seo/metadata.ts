import type { Metadata } from "next";
import { siteConfig, absoluteUrl } from "./config";

interface BuildMetadataOptions {
  /** Page-specific title (without brand suffix — template adds it) */
  title?: string;
  /** Override description; falls back to siteConfig.description */
  description?: string;
  /** Path relative to siteConfig.url, used for canonical + og:url */
  path?: string;
  /** Override OG/Twitter image path (absolute or relative to site URL) */
  image?: string;
  /** Image alt text */
  imageAlt?: string;
  /** Comma-separated or array — appended to siteConfig.keywords */
  keywords?: string[];
  /** OG type — default 'website' */
  ogType?: "website" | "article" | "profile";
  /** Block indexing (used for private/app/auth routes) */
  noindex?: boolean;
  /** Override published time for article-type pages */
  publishedTime?: string;
  /** Override modified time */
  modifiedTime?: string;
}

/**
 * Centralized metadata builder. Returns a Next.js Metadata object with:
 *  - canonical URL
 *  - rich OpenGraph block (incl. og:url, og:image with explicit dims)
 *  - Twitter summary_large_image card
 *  - merged keywords
 *  - robots flags honoring noindex
 *
 * Pages that need a unique title pass `title`; the root layout template
 * (`%s | Findora`) handles the brand suffix. Pages that want a fully
 * custom title can pass it via the absolute form by setting title in the
 * page's own metadata export directly.
 */
export function buildMetadata(opts: BuildMetadataOptions = {}): Metadata {
  const {
    title,
    description = siteConfig.description,
    path = "/",
    image,
    imageAlt = siteConfig.ogImage.alt,
    keywords,
    ogType = "website",
    noindex = false,
    publishedTime,
    modifiedTime,
  } = opts;

  const canonical = absoluteUrl(path);
  const resolvedImagePath = image ?? siteConfig.ogImage.path;
  const ogImageUrl = resolvedImagePath.startsWith("http")
    ? resolvedImagePath
    : `https://findora.live${resolvedImagePath.startsWith("/") ? "" : "/"}${resolvedImagePath}`;

  const finalKeywords = keywords
    ? Array.from(new Set([...siteConfig.keywords, ...keywords]))
    : Array.from(siteConfig.keywords);

  const metadata: Metadata = {
    title,
    description,
    keywords: finalKeywords,
    alternates: {
      canonical,
    },
    robots: noindex
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
          },
        }
      : {
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
      type: ogType,
      title: title ? `${title} | ${siteConfig.name}` : siteConfig.fullName,
      description,
      url: canonical,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      images: [
        {
          url: ogImageUrl,
          width: siteConfig.ogImage.width,
          height: siteConfig.ogImage.height,
          alt: imageAlt,
          type: "image/png",
        },
      ],
      ...(publishedTime && ogType === "article" ? { publishedTime } : {}),
      ...(modifiedTime && ogType === "article" ? { modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: title ? `${title} | ${siteConfig.name}` : siteConfig.fullName,
      description,
      site: siteConfig.social.twitter,
      creator: siteConfig.social.twitter,
      images: [
        {
          url: ogImageUrl,
          alt: imageAlt,
          width: siteConfig.ogImage.width,
          height: siteConfig.ogImage.height,
        },
      ],
    },
  };

  return metadata;
}
