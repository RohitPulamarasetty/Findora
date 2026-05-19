import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "./providers";
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
export const metadata: Metadata = {
  title: {
    default: "Findora — Campus Lost & Found",
    template: "%s | Findora",
  },
  description:
    "The campus lost and found platform. Report lost items, discover found items, and connect with fellow students to recover what matters.",
  keywords: ["lost and found", "campus", "IITM", "student"],
  authors: [{ name: "Rohit Pulamarasetty", url: "https://github.com/RohitPulamarasetty" }],
  creator: "Rohit Pulamarasetty",
  publisher: "Findora",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    title: "Findora — Campus Lost & Found",
    description:
      "The campus lost and found platform. Report lost items, discover found items, and connect with fellow students to recover what matters.",
    siteName: "Findora",
  },
  twitter: {
    card: "summary_large_image",
    title: "Findora — Campus Lost & Found",
    description:
      "Report lost items, discover found items, and connect with fellow students to recover what matters.",
    creator: "@RPulamarasetty",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

// ── Viewport ──────────────────────────────────────────────────────────────────
// Mobile-first: prevent unwanted zoom on form focus on iOS
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F9F8F5" },
    { media: "(prefers-color-scheme: dark)", color: "#0D0D0D" },
  ],
};

// ── Root Layout ───────────────────────────────────────────────────────────────
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning prevents next-themes class injection mismatch
    <html lang="en" suppressHydrationWarning>
      <body
        className={` ${plusJakartaSans.variable} ${jetbrainsMono.variable} font-body antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
