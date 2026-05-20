import { siteConfig, absoluteUrl } from "./config";

/**
 * JSON-LD schema generators. Each returns a plain object that should be
 * serialized via JSON.stringify and rendered inside a
 * <script type="application/ld+json"> tag.
 *
 * Only static, non-user-derived data should flow through here — we avoid
 * XSS by never embedding raw user input into the script.
 */

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteConfig.url}#organization`,
    name: siteConfig.name,
    legalName: siteConfig.name,
    url: siteConfig.url,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/web-app-manifest-512x512.png"),
      width: 512,
      height: 512,
    },
    description: siteConfig.description,
    founder: {
      "@type": "Person",
      name: siteConfig.author.name,
      url: siteConfig.author.url,
    },
    sameAs: [
      siteConfig.social.twitterUrl,
      siteConfig.social.github,
      siteConfig.social.linkedin,
      siteConfig.social.githubRepo,
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: siteConfig.author.email,
      contactType: "customer support",
      availableLanguage: ["English"],
    },
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.url}#website`,
    url: siteConfig.url,
    name: siteConfig.name,
    description: siteConfig.description,
    inLanguage: siteConfig.language,
    publisher: { "@id": `${siteConfig.url}#organization` },
  };
}

export function webApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${siteConfig.url}#webapp`,
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    applicationCategory: "SocialNetworkingApplication",
    operatingSystem: "Web Browser",
    browserRequirements: "Requires modern browser with JavaScript",
    audience: {
      "@type": "EducationalAudience",
      educationalRole: "student",
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
    publisher: { "@id": `${siteConfig.url}#organization` },
  };
}

export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqSchema(items: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };
}
