import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/seo";

/**
 * Dynamic Open Graph image. Resolves to /opengraph-image.png and is served as
 * the og:image / twitter:image fallback for the root layout.
 *
 * Uses the Edge-compatible next/og runtime (no Node deps). Cached at the CDN.
 */

export const runtime = "edge";

export const alt = siteConfig.ogImage.alt;
export const size = {
  width: siteConfig.ogImage.width,
  height: siteConfig.ogImage.height,
};
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "space-between",
        padding: "80px",
        backgroundColor: "#08080c",
        backgroundImage:
          "radial-gradient(at 20% 20%, rgba(59,130,246,0.35) 0%, transparent 50%), radial-gradient(at 80% 80%, rgba(139,92,246,0.30) 0%, transparent 50%), radial-gradient(at 50% 100%, rgba(34,211,238,0.18) 0%, transparent 60%)",
        color: "#ffffff",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Top bar — wordmark */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 24px rgba(59,130,246,0.45)",
            fontSize: 36,
            fontWeight: 800,
            color: "white",
            letterSpacing: "-0.04em",
          }}
        >
          F
        </div>
        <div
          style={{
            fontSize: 40,
            fontWeight: 700,
            letterSpacing: "-0.03em",
          }}
        >
          Findora
        </div>
      </div>

      {/* Headline + sub */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            maxWidth: 980,
            backgroundImage: "linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Campus Community Network
        </div>
        <div
          style={{
            fontSize: 30,
            fontWeight: 500,
            color: "rgba(255,255,255,0.65)",
            maxWidth: 900,
            lineHeight: 1.35,
          }}
        >
          Private, verified peer-to-peer platform built for IITM DS students.
        </div>
      </div>

      {/* Footer pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "12px 22px",
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.12)",
          backgroundColor: "rgba(255,255,255,0.04)",
          fontSize: 22,
          color: "rgba(255,255,255,0.75)",
          fontWeight: 500,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            backgroundColor: "#34d399",
            boxShadow: "0 0 12px rgba(52,211,153,0.7)",
          }}
        />
        findora.app · Verified IITM DS access only
      </div>
    </div>,
    { ...size }
  );
}
