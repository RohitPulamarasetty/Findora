import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Shield,
  MessageCircle,
  Zap,
  MapPin,
  CheckCircle2,
  Package,
  Search,
  Bell,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { buildMetadata, JsonLd, faqSchema, breadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  description:
    "Findora is a secure IITM campus lost and found platform helping students recover lost items quickly through verified reporting and matching.",
  path: "/",
  keywords: [
    "Findora",
    "Findora lost and found",
    "IITM lost and found",
    "IIT Madras lost and found",
    "campus lost and found",
    "lost item recovery campus",
    "find lost belongings IITM",
    "verified student platform",
    "IITM campus platform",
  ],
});

const HOME_FAQ = [
  {
    question: "What is Findora?",
    answer:
      "Findora is the trusted campus lost & found platform for verified IITM students. It helps you recover lost belongings faster by replacing scattered WhatsApp groups and notice boards with one private, identity-verified system.",
  },
  {
    question: "Who can use Findora?",
    answer:
      "Findora is restricted to verified IITM student accounts (@ds.study.iitm.ac.in, @es.study.iitm.ac.in, @study.iitm.ac.in) via Google OAuth. Only authenticated IITM students can post or browse lost-and-found items.",
  },
  {
    question: "How does recovery work on Findora?",
    answer:
      "Report a lost or found item with photos and location context. Findora surfaces matches across category and keyword search. Owner and finder connect through private in-app messaging — no phone numbers shared publicly.",
  },
  {
    question: "Is Findora free?",
    answer:
      "Yes. Findora is free for all eligible IITM students. There are no subscriptions, ads, or hidden fees.",
  },
  {
    question: "How is my data protected?",
    answer:
      "Findora is built on a privacy-first architecture: row-level security, encrypted session cookies, no third-party trackers, and private in-app messaging restricted to participants.",
  },
];

const SOCIAL_ICONS = {
  github: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.11.79-.25.79-.56v-1.97c-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.8 1.18 1.83 1.18 3.09 0 4.43-2.69 5.4-5.26 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.36V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .78 0 1.74v20.52C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.74V1.74C24 .78 23.2 0 22.22 0Z" />
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  ),
};

/* ─────────────────────────────────────────────────────────────────────────────
   PHONE SCREEN — item illustrations + app UI
───────────────────────────────────────────────────────────────────────────── */

function AirPodsIllustration() {
  return (
    <svg viewBox="0 0 80 58" fill="none" style={{ width: "52px", height: "37px" }}>
      <defs>
        <linearGradient id="phi-aw-body" x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="38%" stopColor="#F5F5FC" />
          <stop offset="100%" stopColor="#DCDCE8" />
        </linearGradient>
        <linearGradient id="phi-aw-stem" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E6E6F0" />
          <stop offset="48%" stopColor="#FAFAFA" />
          <stop offset="100%" stopColor="#E0E0EA" />
        </linearGradient>
        <radialGradient id="phi-aw-mesh" cx="50%" cy="52%" r="48%">
          <stop offset="0%" stopColor="rgba(50,30,110,0.26)" />
          <stop offset="65%" stopColor="rgba(50,30,110,0.10)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id="phi-aw-f" x="-45%" y="-40%" width="190%" height="180%">
          <feDropShadow dx="0" dy="3.5" stdDeviation="4" floodColor="rgba(70,30,150,0.28)" />
        </filter>
      </defs>

      {/* LEFT AIRPOD PRO */}
      <g transform="translate(4,1) rotate(-13,18,30)" filter="url(#phi-aw-f)">
        {/* Stem — rounded rect with lateral gradient */}
        <rect x="12" y="19" width="12" height="26" rx="6" fill="url(#phi-aw-stem)" />
        {/* Stem left-edge shadow */}
        <rect x="12" y="19" width="3.5" height="26" rx="6" fill="rgba(0,0,0,0.07)" />
        {/* Stem center highlight */}
        <rect x="15" y="23" width="3" height="11" rx="1.5" fill="rgba(255,255,255,0.82)" />
        {/* Force-sensor indent line */}
        <rect x="12" y="30" width="12" height="1.2" rx="0.6" fill="rgba(0,0,0,0.10)" />
        {/* Mic port — two tiny circles */}
        <circle cx="16.5" cy="42" r="0.9" fill="rgba(0,0,0,0.28)" />
        <circle cx="19.5" cy="42" r="0.9" fill="rgba(0,0,0,0.28)" />
        {/* Earbud head */}
        <ellipse cx="18" cy="14" rx="9.5" ry="11" fill="url(#phi-aw-body)" />
        {/* Earbud left-edge ambient shadow */}
        <ellipse cx="13" cy="15.5" rx="5.5" ry="9" fill="rgba(0,0,0,0.055)" />
        {/* Speaker mesh — oval in center of earbud face */}
        <ellipse cx="18" cy="16" rx="5.5" ry="6.5" fill="url(#phi-aw-mesh)" />
        {/* Speaker mesh rim */}
        <ellipse
          cx="18"
          cy="16"
          rx="5.5"
          ry="6.5"
          fill="none"
          stroke="rgba(80,50,140,0.12)"
          strokeWidth="0.6"
        />
        {/* Silicone ear tip */}
        <ellipse cx="18" cy="22.5" rx="7" ry="3" fill="rgba(205,205,225,0.92)" />
        <ellipse cx="18" cy="22.5" rx="4.8" ry="1.8" fill="rgba(185,185,210,0.75)" />
        {/* Top specular highlight */}
        <ellipse cx="14" cy="9" rx="3.2" ry="4" fill="rgba(255,255,255,0.60)" />
      </g>

      {/* RIGHT AIRPOD PRO */}
      <g transform="translate(42,3) rotate(13,18,30)" filter="url(#phi-aw-f)">
        <rect x="12" y="19" width="12" height="26" rx="6" fill="url(#phi-aw-stem)" />
        <rect x="20.5" y="19" width="3.5" height="26" rx="6" fill="rgba(0,0,0,0.07)" />
        <rect x="15" y="23" width="3" height="11" rx="1.5" fill="rgba(255,255,255,0.82)" />
        <rect x="12" y="30" width="12" height="1.2" rx="0.6" fill="rgba(0,0,0,0.10)" />
        <circle cx="16.5" cy="42" r="0.9" fill="rgba(0,0,0,0.28)" />
        <circle cx="19.5" cy="42" r="0.9" fill="rgba(0,0,0,0.28)" />
        <ellipse cx="18" cy="14" rx="9.5" ry="11" fill="url(#phi-aw-body)" />
        <ellipse cx="23" cy="15.5" rx="5.5" ry="9" fill="rgba(0,0,0,0.055)" />
        <ellipse cx="18" cy="16" rx="5.5" ry="6.5" fill="url(#phi-aw-mesh)" />
        <ellipse
          cx="18"
          cy="16"
          rx="5.5"
          ry="6.5"
          fill="none"
          stroke="rgba(80,50,140,0.12)"
          strokeWidth="0.6"
        />
        <ellipse cx="18" cy="22.5" rx="7" ry="3" fill="rgba(205,205,225,0.92)" />
        <ellipse cx="18" cy="22.5" rx="4.8" ry="1.8" fill="rgba(185,185,210,0.75)" />
        <ellipse cx="14" cy="9" rx="3.2" ry="4" fill="rgba(255,255,255,0.60)" />
      </g>
    </svg>
  );
}

function WalletIllustration() {
  return (
    <svg viewBox="0 0 72 50" fill="none" style={{ width: "48px", height: "33px" }}>
      <defs>
        <linearGradient id="phi-wb-face" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9B6540" />
          <stop offset="45%" stopColor="#7A4A20" />
          <stop offset="100%" stopColor="#4E2D0A" />
        </linearGradient>
        <linearGradient id="phi-wb-top" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </linearGradient>
        <linearGradient id="phi-wb-spine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3E1E06" />
          <stop offset="50%" stopColor="#7A4A20" />
          <stop offset="100%" stopColor="#3E1E06" />
        </linearGradient>
        <linearGradient id="phi-wb-card1" x1="0%" y1="0%" x2="100%" y2="80%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>
        <linearGradient id="phi-wb-cash" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <filter id="phi-wb-shadow" x="-18%" y="-20%" width="136%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="rgba(50,22,5,0.50)" />
        </filter>
      </defs>
      <g filter="url(#phi-wb-shadow)">
        {/* Wallet body */}
        <rect x="3" y="5" width="66" height="38" rx="6" fill="url(#phi-wb-face)" />
        <rect x="3" y="5" width="66" height="38" rx="6" fill="url(#phi-wb-top)" />
        {/* Center spine fold */}
        <rect x="33.5" y="5" width="5" height="38" fill="url(#phi-wb-spine)" />
        <rect x="35" y="5" width="1.5" height="38" fill="rgba(255,255,255,0.09)" />
        {/* Card 1 — credit card in left slot */}
        <rect x="5" y="7" width="26" height="18" rx="3" fill="url(#phi-wb-card1)" />
        <rect x="8" y="10" width="7" height="5" rx="1.2" fill="rgba(255,210,80,0.85)" />
        <rect x="9.5" y="11.2" width="4" height="0.9" rx="0.45" fill="rgba(180,140,20,0.65)" />
        <rect x="9.5" y="12.6" width="4" height="0.9" rx="0.45" fill="rgba(180,140,20,0.65)" />
        {[17, 21, 25, 29].map((x) => (
          <circle key={x} cx={x} cy="16.5" r="1" fill="rgba(255,255,255,0.55)" />
        ))}
        <rect x="5" y="7" width="26" height="5" rx="3" fill="rgba(255,255,255,0.12)" />
        {/* Card 2 below */}
        <rect x="5" y="27" width="26" height="14" rx="3" fill="rgba(0,0,0,0.20)" />
        <rect x="7" y="29" width="16" height="1.2" rx="0.6" fill="rgba(255,255,255,0.22)" />
        <rect x="7" y="31.5" width="12" height="1" rx="0.5" fill="rgba(255,255,255,0.15)" />
        {/* Cash bill peeking */}
        <rect x="38" y="5" width="28" height="7" rx="3" fill="url(#phi-wb-cash)" />
        <rect x="40" y="7.5" width="14" height="1" rx="0.5" fill="rgba(255,255,255,0.30)" />
        {/* Cash pocket */}
        <rect x="38" y="12" width="28" height="29" rx="3" fill="rgba(0,0,0,0.14)" />
        <rect x="40" y="16" width="20" height="1.5" rx="0.75" fill="rgba(255,255,255,0.18)" />
        <rect x="40" y="19" width="14" height="1.2" rx="0.6" fill="rgba(255,255,255,0.12)" />
        <rect x="40" y="22" width="18" height="1.2" rx="0.6" fill="rgba(255,255,255,0.10)" />
        {/* Stitching top */}
        {Array.from({ length: 12 }, (_, i) => (
          <rect
            key={`st-${i}`}
            x={5 + i * 5.6}
            y="5.5"
            width="2.2"
            height="0.9"
            rx="0.45"
            fill="rgba(255,210,140,0.22)"
          />
        ))}
        {/* Stitching bottom */}
        {Array.from({ length: 12 }, (_, i) => (
          <rect
            key={`sb-${i}`}
            x={5 + i * 5.6}
            y="41.5"
            width="2.2"
            height="0.9"
            rx="0.45"
            fill="rgba(255,210,140,0.18)"
          />
        ))}
        <rect x="3" y="39" width="66" height="4" rx="6" fill="rgba(0,0,0,0.16)" />
      </g>
    </svg>
  );
}

function IDCardIllustration() {
  return (
    <svg viewBox="0 0 52 66" fill="none" style={{ width: "32px", height: "40px" }}>
      <defs>
        <linearGradient id="phi-id-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="55%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>
        <linearGradient id="phi-id-header" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="50%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>
        <linearGradient id="phi-id-gold" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#B45309" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id="phi-id-photo" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>
        <filter id="phi-id-drop" x="-20%" y="-10%" width="140%" height="120%">
          <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="rgba(15,25,80,0.48)" />
        </filter>
      </defs>
      <g filter="url(#phi-id-drop)">
        {/* Card body */}
        <rect x="2" y="2" width="48" height="62" rx="5" fill="url(#phi-id-bg)" />
        {/* White header band */}
        <rect x="2" y="2" width="48" height="15" rx="5" fill="rgba(255,255,255,0.95)" />
        <rect x="2" y="11" width="48" height="6" fill="rgba(255,255,255,0.95)" />
        {/* IIT Madras logo area in header */}
        <circle cx="10" cy="8.5" r="4.5" fill="url(#phi-id-header)" />
        <circle cx="10" cy="8.5" r="2.2" fill="rgba(255,255,255,0.25)" />
        <rect x="9.2" y="6.8" width="1.6" height="3.4" rx="0.4" fill="rgba(255,255,255,0.85)" />
        <rect x="8.2" y="9.2" width="3.6" height="1" rx="0.3" fill="rgba(255,255,255,0.85)" />
        {/* IIT MADRAS text */}
        <rect x="17" y="6" width="30" height="2.2" rx="1.1" fill="rgba(30,64,175,0.75)" />
        <rect x="19" y="9.2" width="24" height="1.6" rx="0.8" fill="rgba(30,64,175,0.45)" />
        {/* Gold accent stripe */}
        <rect x="2" y="17" width="48" height="3" fill="url(#phi-id-gold)" />
        {/* Photo area */}
        <rect x="5" y="23" width="16" height="20" rx="3" fill="url(#phi-id-photo)" />
        {/* Person silhouette in photo */}
        <circle cx="13" cy="29" r="4.5" fill="rgba(71,85,105,0.72)" />
        <path d="M5.5 43c0-4.14 3.36-7.5 7.5-7.5s7.5 3.36 7.5 7.5" fill="rgba(71,85,105,0.55)" />
        {/* Photo border */}
        <rect
          x="5"
          y="23"
          width="16"
          height="20"
          rx="3"
          fill="none"
          stroke="rgba(255,255,255,0.20)"
          strokeWidth="0.8"
        />
        {/* Student info lines */}
        <rect x="24" y="23" width="23" height="2.5" rx="1.25" fill="rgba(255,255,255,0.88)" />
        <rect x="24" y="27.5" width="16" height="2" rx="1" fill="rgba(255,255,255,0.55)" />
        <rect x="24" y="31" width="20" height="2" rx="1" fill="rgba(255,255,255,0.45)" />
        <rect x="24" y="34.5" width="12" height="2" rx="1" fill="rgba(255,255,255,0.35)" />
        {/* IITM badge */}
        <rect x="24" y="38" width="22" height="6" rx="2" fill="rgba(245,158,11,0.25)" />
        <rect
          x="24"
          y="38"
          width="22"
          height="6"
          rx="2"
          stroke="rgba(245,158,11,0.45)"
          strokeWidth="0.6"
          fill="none"
        />
        <rect x="26" y="40" width="10" height="1.5" rx="0.75" fill="rgba(245,158,11,0.85)" />
        <rect x="26" y="42.2" width="7" height="1" rx="0.5" fill="rgba(245,158,11,0.60)" />
        {/* Barcode strip */}
        <rect x="5" y="47" width="42" height="10" rx="2" fill="rgba(255,255,255,0.08)" />
        {Array.from({ length: 22 }, (_, i) => (
          <rect
            key={`bc-${i}`}
            x={6.5 + i * 1.82}
            y="48"
            width={i % 4 === 0 ? 0.7 : 1.1}
            height="7"
            rx="0.2"
            fill="rgba(255,255,255,0.68)"
          />
        ))}
        {/* Lanyard punch hole */}
        <circle cx="26" cy="2" r="2.5" fill="rgba(0,0,0,0.35)" />
        <circle cx="26" cy="2" r="1.5" fill="rgba(0,0,0,0.55)" />
        {/* Card top shine */}
        <rect x="2" y="2" width="48" height="5" rx="5" fill="rgba(255,255,255,0.10)" />
        <rect x="2" y="2" width="10" height="62" rx="5" fill="rgba(255,255,255,0.04)" />
      </g>
    </svg>
  );
}

function PhoneScreen() {
  return (
    <div
      className="relative flex h-full flex-col overflow-hidden"
      style={{ background: "#F2F3F9" }}
    >
      {/* ── Status bar ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pb-0.5 pt-1.5">
        <span className="text-[8px] font-semibold" style={{ color: "#18183A" }}>
          9:41
        </span>
        <div className="flex items-center gap-[5px]">
          <div className="flex items-end gap-[1.5px]">
            {[3, 4, 6, 8].map((h, i) => (
              <div
                key={i}
                className="w-[2px] rounded-[1px]"
                style={{ height: `${h}px`, background: i < 3 ? "#18183A" : "rgba(24,24,58,0.25)" }}
              />
            ))}
          </div>
          <svg className="h-[9px] w-[9px]" viewBox="0 0 20 20" fill="#18183A">
            <path d="M10 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM2.93 7.07a10 10 0 0 1 14.14 0l-1.42 1.42a8 8 0 0 0-11.3 0L2.93 7.07zm2.83 2.83a6 6 0 0 1 8.48 0L12.82 11.3a4 4 0 0 0-5.66 0L5.76 9.9z" />
          </svg>
          <div className="flex items-center gap-[1px]">
            <div className="flex h-[8px] w-[14px] items-center rounded-[2px] border border-[#18183A] p-[1.5px]">
              <div className="h-full w-[85%] rounded-[1px]" style={{ background: "#18183A" }} />
            </div>
            <div className="h-[4px] w-[1.5px] rounded-r-[1px]" style={{ background: "#18183A" }} />
          </div>
        </div>
      </div>

      {/* ── App header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3.5 pb-[7px] pt-[3px]">
        <div className="flex items-center gap-[7px]">
          <div
            className="flex h-[22px] w-[22px] items-center justify-center rounded-[7px]"
            style={{
              background: "linear-gradient(135deg,#7C4DFF,#5B21B6)",
              boxShadow: "0 2px 8px rgba(124,77,255,0.44)",
            }}
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-[11px] w-[11px]">
              <path d="M10 2L2 8v10h5v-5h6v5h5V8L10 2z" fill="white" />
            </svg>
          </div>
          <span className="text-[13px] font-black tracking-[-0.03em]" style={{ color: "#18183A" }}>
            Findora
          </span>
        </div>
        <div
          className="relative flex h-[26px] w-[26px] items-center justify-center rounded-full"
          style={{ background: "rgba(124,77,255,0.09)", border: "1px solid rgba(124,77,255,0.12)" }}
        >
          <svg className="h-[12px] w-[12px]" viewBox="0 0 20 20" fill="#7C4DFF">
            <path d="M10 2a6 6 0 0 0-6 6v3.5l-1.5 1.5V15h15v-2L16 11.5V8a6 6 0 0 0-6-6zm0 16a2 2 0 0 0 2-2H8a2 2 0 0 0 2 2z" />
          </svg>
          <div
            className="absolute right-[4px] top-[4px] h-[5px] w-[5px] rounded-full ring-[1.5px] ring-white"
            style={{ background: "#FF3B30" }}
          />
        </div>
      </div>

      {/* ── Search bar ─────────────────────────────────────────────── */}
      <div className="mx-3.5 mb-[8px]">
        <div
          className="flex items-center gap-[7px] rounded-[12px] px-[10px] py-[7px]"
          style={{ background: "rgba(124,77,255,0.06)", border: "1px solid rgba(124,77,255,0.11)" }}
        >
          <svg
            className="h-[9px] w-[9px] shrink-0"
            viewBox="0 0 16 16"
            fill="none"
            stroke="rgba(109,40,217,0.55)"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <circle cx="7" cy="7" r="4.5" />
            <line x1="10.5" y1="10.5" x2="13.5" y2="13.5" />
          </svg>
          <span className="text-[7.5px] font-medium" style={{ color: "rgba(109,40,217,0.52)" }}>
            Search lost &amp; found items...
          </span>
        </div>
      </div>

      {/* ── Category pills ─────────────────────────────────────────── */}
      <div className="mx-3.5 mb-[9px] flex gap-[5px]">
        <div
          className="rounded-full px-[10px] py-[3.5px] text-[7.5px] font-bold text-white"
          style={{
            background: "linear-gradient(135deg,#7C4DFF,#6D28D9)",
            boxShadow: "0 2px 8px rgba(124,77,255,0.42)",
          }}
        >
          All
        </div>
        <div
          className="rounded-full px-[10px] py-[3.5px] text-[7.5px] font-semibold"
          style={{
            border: "1px solid rgba(239,68,68,0.28)",
            color: "rgba(220,38,38,0.85)",
            background: "rgba(239,68,68,0.07)",
          }}
        >
          Lost
        </div>
        <div
          className="rounded-full px-[10px] py-[3.5px] text-[7.5px] font-semibold"
          style={{
            border: "1px solid rgba(34,197,94,0.28)",
            color: "rgba(22,163,74,0.85)",
            background: "rgba(34,197,94,0.07)",
          }}
        >
          Found
        </div>
      </div>

      {/* ── Section header ─────────────────────────────────────────── */}
      <div className="mx-3.5 mb-[6px] flex items-center justify-between">
        <p
          className="text-[7px] font-extrabold uppercase tracking-[0.12em]"
          style={{ color: "rgba(109,40,217,0.55)" }}
        >
          Recent Reports
        </p>
        <span className="text-[7px] font-semibold" style={{ color: "rgba(124,77,255,0.60)" }}>
          See all →
        </span>
      </div>

      {/* ── 2-column grid cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-[6px] px-[10px]">
        {/* AirPods Pro */}
        <div
          className="overflow-hidden rounded-[12px] bg-white"
          style={{
            boxShadow: "0 2px 10px rgba(109,40,217,0.09), 0 1px 3px rgba(0,0,0,0.05)",
            border: "1px solid rgba(109,40,217,0.07)",
          }}
        >
          <div
            className="relative flex items-center justify-center"
            style={{ background: "linear-gradient(145deg,#EDE9FE,#F5F3FF)", height: "70px" }}
          >
            <AirPodsIllustration />
            <div
              className="absolute left-[5px] top-[5px] rounded-full px-[5px] py-[1.5px] text-[6px] font-bold uppercase tracking-[0.04em] text-white"
              style={{ background: "#EF4444" }}
            >
              Lost
            </div>
          </div>
          <div className="p-[8px]">
            <p className="truncate text-[7.5px] font-semibold" style={{ color: "#7C4DFF" }}>
              Electronics
            </p>
            <p
              className="truncate text-[10.5px] font-bold leading-tight"
              style={{ color: "#18183A" }}
            >
              AirPods Pro
            </p>
            <div className="mt-[3px] flex items-center gap-[3px]">
              <svg className="h-[6.5px] w-[6.5px] shrink-0" viewBox="0 0 16 16" fill="#C8C8DC">
                <path d="M8 1a5 5 0 0 0-5 5c0 4 5 9 5 9s5-5 5-9a5 5 0 0 0-5-5zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
              </svg>
              <p className="truncate text-[7px]" style={{ color: "#C8C8DC" }}>
                Hostel B · 2h ago
              </p>
            </div>
          </div>
        </div>

        {/* Leather Wallet */}
        <div
          className="overflow-hidden rounded-[12px] bg-white"
          style={{
            boxShadow: "0 2px 10px rgba(109,40,217,0.09), 0 1px 3px rgba(0,0,0,0.05)",
            border: "1px solid rgba(109,40,217,0.07)",
          }}
        >
          <div
            className="relative flex items-center justify-center"
            style={{ background: "linear-gradient(145deg,#FEF3C7,#FFFBEB)", height: "70px" }}
          >
            <WalletIllustration />
            <div
              className="absolute left-[5px] top-[5px] rounded-full px-[5px] py-[1.5px] text-[6px] font-bold uppercase tracking-[0.04em] text-white"
              style={{ background: "#EF4444" }}
            >
              Lost
            </div>
          </div>
          <div className="p-[8px]">
            <p className="truncate text-[7.5px] font-semibold" style={{ color: "#D97706" }}>
              Accessories
            </p>
            <p
              className="truncate text-[10.5px] font-bold leading-tight"
              style={{ color: "#18183A" }}
            >
              Leather Wallet
            </p>
            <div className="mt-[3px] flex items-center gap-[3px]">
              <svg className="h-[6.5px] w-[6.5px] shrink-0" viewBox="0 0 16 16" fill="#C8C8DC">
                <path d="M8 1a5 5 0 0 0-5 5c0 4 5 9 5 9s5-5 5-9a5 5 0 0 0-5-5zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
              </svg>
              <p className="truncate text-[7px]" style={{ color: "#C8C8DC" }}>
                Mess Block · 4h ago
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Featured card ───────────────────────────────────────────── */}
      <div
        className="mx-[10px] mt-[7px] overflow-hidden rounded-[13px] bg-white"
        style={{
          boxShadow: "0 2px 12px rgba(109,40,217,0.11), 0 1px 4px rgba(0,0,0,0.06)",
          border: "1px solid rgba(109,40,217,0.09)",
        }}
      >
        <div className="flex items-center gap-[10px] p-[9px]">
          <div
            className="relative flex h-[42px] w-[42px] shrink-0 items-center justify-center overflow-hidden rounded-[10px]"
            style={{ background: "linear-gradient(135deg,#DBEAFE,#EFF6FF)" }}
          >
            <IDCardIllustration />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-[2px] flex items-center gap-[5px]">
              <span
                className="rounded-full px-[5px] py-[1px] text-[6px] font-bold text-white"
                style={{ background: "#22C55E" }}
              >
                Found
              </span>
              <span className="truncate text-[10px] font-bold" style={{ color: "#18183A" }}>
                IITM ID Card
              </span>
            </div>
            <p className="text-[7px]" style={{ color: "#C8C8DC" }}>
              📍 Central Library · 30m ago
            </p>
          </div>
          <div
            className="shrink-0 rounded-[8px] px-[9px] py-[5.5px]"
            style={{
              background: "linear-gradient(135deg,#7C4DFF,#6D28D9)",
              boxShadow: "0 2px 8px rgba(124,77,255,0.40)",
            }}
          >
            <span className="text-[7px] font-bold text-white">View →</span>
          </div>
        </div>
      </div>

      {/* ── Mini stats strip ───────────────────────────────────────── */}
      <div className="mx-[10px] mt-[7px] flex gap-[5px]">
        <div
          className="flex-1 rounded-[10px] px-[8px] py-[5px]"
          style={{ background: "rgba(124,77,255,0.07)", border: "1px solid rgba(124,77,255,0.10)" }}
        >
          <p className="text-[6.5px] font-semibold" style={{ color: "rgba(109,40,217,0.58)" }}>
            Open
          </p>
          <p className="text-[13px] font-black leading-tight" style={{ color: "#7C4DFF" }}>
            24
          </p>
        </div>
        <div
          className="flex-1 rounded-[10px] px-[8px] py-[5px]"
          style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.11)" }}
        >
          <p className="text-[6.5px] font-semibold" style={{ color: "rgba(22,163,74,0.58)" }}>
            Recovered
          </p>
          <p className="text-[13px] font-black leading-tight" style={{ color: "#16A34A" }}>
            143
          </p>
        </div>
        <div
          className="flex-1 rounded-[10px] px-[8px] py-[5px]"
          style={{ background: "rgba(255,122,24,0.07)", border: "1px solid rgba(255,122,24,0.11)" }}
        >
          <p className="text-[6.5px] font-semibold" style={{ color: "rgba(234,88,8,0.58)" }}>
            Today
          </p>
          <p className="text-[13px] font-black leading-tight" style={{ color: "#EA5808" }}>
            7
          </p>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* ── Bottom navigation ──────────────────────────────────────── */}
      <div
        className="absolute inset-x-0 bottom-0 bg-white px-2 pb-[7px] pt-[5px]"
        style={{
          borderTop: "1px solid rgba(109,40,217,0.08)",
          boxShadow: "0 -4px 16px rgba(0,0,0,0.05)",
        }}
      >
        <div className="flex items-center justify-around">
          {/* Home — active */}
          <div className="flex flex-col items-center gap-[2px]">
            <div
              className="flex h-[24px] w-[24px] items-center justify-center rounded-[8px]"
              style={{ background: "rgba(124,77,255,0.12)" }}
            >
              <svg className="h-[11px] w-[11px]" viewBox="0 0 20 20" fill="#7C4DFF">
                <path d="M10 2L2 8v10h5v-5h6v5h5V8L10 2z" />
              </svg>
            </div>
            <span className="text-[5.5px] font-bold" style={{ color: "#7C4DFF" }}>
              Home
            </span>
          </div>
          {/* Search */}
          <div className="flex flex-col items-center gap-[2px]">
            <div className="flex h-[24px] w-[24px] items-center justify-center">
              <svg
                className="h-[12px] w-[12px]"
                viewBox="0 0 20 20"
                fill="none"
                stroke="#C4C4D8"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <circle cx="9" cy="9" r="6" />
                <line x1="13.5" y1="13.5" x2="17" y2="17" />
              </svg>
            </div>
            <span className="text-[5.5px] font-medium" style={{ color: "#C4C4D8" }}>
              Search
            </span>
          </div>
          {/* Report FAB */}
          <div className="flex flex-col items-center gap-[2px]">
            <div
              className="flex h-[28px] w-[28px] items-center justify-center rounded-[10px]"
              style={{
                background: "linear-gradient(135deg,#FF7A18 0%,#7C4DFF 100%)",
                boxShadow: "0 3px 10px rgba(124,77,255,0.52)",
              }}
            >
              <svg className="h-[11px] w-[11px]" viewBox="0 0 20 20" fill="none">
                <path d="M10 4v12M4 10h12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-[5.5px] font-semibold" style={{ color: "#7C4DFF" }}>
              Report
            </span>
          </div>
          {/* Messages */}
          <div className="relative flex flex-col items-center gap-[2px]">
            <div className="flex h-[24px] w-[24px] items-center justify-center">
              <svg
                className="h-[12px] w-[12px]"
                viewBox="0 0 20 20"
                fill="none"
                stroke="#C4C4D8"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 10c0 3.866-3.582 7-8 7a8.8 8.8 0 0 1-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" />
              </svg>
            </div>
            <span className="text-[5.5px] font-medium" style={{ color: "#C4C4D8" }}>
              Messages
            </span>
            <div
              className="absolute right-[1px] top-[1px] h-[5px] w-[5px] rounded-full ring-[1px] ring-white"
              style={{ background: "#FF3B30" }}
            />
          </div>
          {/* Profile */}
          <div className="flex flex-col items-center gap-[2px]">
            <div className="flex h-[24px] w-[24px] items-center justify-center">
              <svg className="h-[12px] w-[12px]" viewBox="0 0 20 20" fill="#C4C4D8">
                <path
                  fillRule="evenodd"
                  d="M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8a7 7 0 1 1 14 0H3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-[5.5px] font-medium" style={{ color: "#C4C4D8" }}>
              Profile
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   PHONE MOCKUP — 3D premium device shell
───────────────────────────────────────────────────────────────────────────── */

function PhoneMockup() {
  return (
    /* Outer wrapper — extra bottom padding makes room for the pedestal + glow */
    <div className="relative" style={{ padding: "0 20px 104px" }}>
      {/* ── AMBIENT GLOW LAYER 1: Wide deep-purple sweep ──────────────── */}
      <div
        aria-hidden
        className="absolute -inset-20 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 76% 66% at 52% 38%, rgba(109,40,217,0.72) 0%, rgba(124,77,255,0.30) 42%, transparent 68%)",
          filter: "blur(34px)",
        }}
      />

      {/* ── AMBIENT GLOW LAYER 2: Mid device halo ─────────────────────── */}
      <div
        aria-hidden
        className="absolute -z-10"
        style={{
          inset: "4% 12% 26% 12%",
          background:
            "radial-gradient(ellipse 100% 100% at 50% 34%, rgba(124,77,255,0.62) 0%, rgba(109,40,217,0.26) 52%, transparent 76%)",
          filter: "blur(18px)",
        }}
      />

      {/* ── AMBIENT GLOW LAYER 3: Tight screen-reflection core ────────── */}
      <div
        aria-hidden
        className="absolute -z-10"
        style={{
          inset: "10% 20% 36% 20%",
          background:
            "radial-gradient(ellipse 100% 100% at 50% 28%, rgba(139,92,246,0.48) 0%, transparent 68%)",
          filter: "blur(10px)",
        }}
      />

      {/* ── AMBIENT GLOW LAYER 4: Top-edge device-emission highlight ──── */}
      <div
        aria-hidden
        className="absolute -z-10"
        style={{
          inset: "0% 22% 70% 22%",
          background:
            "radial-gradient(ellipse 100% 100% at 50% 100%, rgba(167,139,250,0.38) 0%, transparent 72%)",
          filter: "blur(8px)",
        }}
      />

      {/* ── DEVICE with 3D tilt ────────────────────────────────────────── */}
      {/* w-[240px] at lg, grows at xl/2xl. md width removed — phone is
          hidden below lg so that breakpoint is dead code. */}
      <div
        className="phone-3d-tilt relative w-[240px] xl:w-[272px] 2xl:w-[298px]"
        style={{ transformOrigin: "50% 50%" }}
      >
        {/* Mute toggle */}
        <div
          className="absolute -left-[6px] rounded-l-[3px]"
          style={{
            top: "82px",
            width: "5px",
            height: "24px",
            background: "linear-gradient(to right, #1C0A44, #4A2882, #1C0A44)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.38)",
          }}
        />
        {/* Vol up */}
        <div
          className="absolute -left-[6px] rounded-l-[3px]"
          style={{
            top: "118px",
            width: "5px",
            height: "38px",
            background: "linear-gradient(to right, #1C0A44, #4A2882, #1C0A44)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.38)",
          }}
        />
        {/* Vol down */}
        <div
          className="absolute -left-[6px] rounded-l-[3px]"
          style={{
            top: "168px",
            width: "5px",
            height: "38px",
            background: "linear-gradient(to right, #1C0A44, #4A2882, #1C0A44)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.38)",
          }}
        />
        {/* Power */}
        <div
          className="absolute -right-[6px] rounded-r-[3px]"
          style={{
            top: "124px",
            width: "5px",
            height: "60px",
            background: "linear-gradient(to left, #1C0A44, #4A2882, #1C0A44)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.38)",
          }}
        />

        {/* ── Phone body ─────────────────────────────────────────────── */}
        {/* aspectRatio "393/852" = iPhone 15 Pro screen ratio (0.461).
            Combined with the 11px padding, the overall device proportions
            match a real modern flagship — width and height always scale
            together, eliminating the squat/stubby stretching at xl/2xl. */}
        <div
          className="overflow-hidden rounded-[44px]"
          style={{
            aspectRatio: "393/852",
            display: "flex",
            flexDirection: "column",
            background:
              "linear-gradient(165deg, #4E2E88 0%, #2C1662 12%, #1E0C4C 28%, #140832 50%, #1E0C4C 68%, #3C2074 88%, #1E0C4C 100%)",
            border: "1.5px solid",
            borderColor:
              "rgba(255,255,255,0.56) rgba(255,255,255,0.18) rgba(255,255,255,0.06) rgba(255,255,255,0.44)",
            boxShadow: [
              "inset 0 2px 0 rgba(255,255,255,0.50)",
              "inset 2px 0 8px rgba(200,160,255,0.10)",
              "inset 0 -1px 0 rgba(0,0,0,0.58)",
              "0 0 0 1.5px rgba(0,0,0,0.88)",
              "0 60px 120px rgba(0,0,0,0.84)",
              "0 32px 60px rgba(0,0,0,0.65)",
              "0 12px 28px rgba(0,0,0,0.50)",
              "0 44px 88px rgba(109,40,217,0.38)",
              "0 0 40px rgba(139,92,246,0.12)",
            ].join(", "),
            padding: "11px",
          }}
        >
          {/* ── Screen — fills phone body via flex-1 ────────────────── */}
          <div
            className="relative flex flex-1 flex-col overflow-hidden"
            style={{
              borderRadius: "33px",
              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.24), inset 0 2px 8px rgba(0,0,0,0.30)",
            }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-10"
              style={{
                borderRadius: "33px",
                background:
                  "linear-gradient(100deg, rgba(255,255,255,0.04) 0%, transparent 38%, rgba(0,0,0,0.05) 100%)",
              }}
            />
            {/* Dynamic Island */}
            <div
              className="flex items-center justify-center bg-[#F8F9FF]"
              style={{ paddingTop: "10px", paddingBottom: "4px" }}
            >
              <div
                style={{
                  width: "30%",
                  height: "11px",
                  borderRadius: "999px",
                  background: "#0a0a0a",
                }}
              />
            </div>

            {/* App UI — flex-1 so it fills the remaining screen height.
                PhoneScreen is already "relative flex h-full flex-col"
                with a flex-1 spacer before the bottom nav, so it adapts
                naturally to any height the aspect-ratio produces. */}
            <div className="min-h-0 flex-1">
              <PhoneScreen />
            </div>

            {/* Home indicator */}
            <div
              className="flex items-center justify-center bg-white"
              style={{ paddingTop: "6px", paddingBottom: "8px" }}
            >
              <div
                style={{
                  width: "28%",
                  height: "4px",
                  borderRadius: "999px",
                  background: "#D1D5DB",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── PEDESTAL SYSTEM ───────────────────────────────────────────── */}

      {/* Device contact shadow — offset 4% right because phone leans left */}
      <div
        aria-hidden
        className="absolute left-1/2 -z-10"
        style={{
          bottom: "60px",
          transform: "translateX(-46%) scaleX(0.88) scaleY(1.1)",
          width: "200px",
          height: "22px",
          background: "rgba(0,0,0,0.82)",
          filter: "blur(16px)",
          borderRadius: "50%",
        }}
      />

      {/* Pedestal disc — dark premium surface */}
      <div
        aria-hidden
        className="absolute left-1/2 -z-10"
        style={{
          bottom: "62px",
          transform: "translateX(-50%)",
          width: "238px",
          height: "38px",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse 100% 100% at 50% 18%, #3A1E70 0%, #200E4E 46%, #100A28 72%, #070418 100%)",
          border: "1px solid rgba(139,92,246,0.34)",
          boxShadow:
            "0 6px 28px rgba(0,0,0,0.74), inset 0 1px 0 rgba(255,255,255,0.14), 0 0 24px rgba(124,77,255,0.28)",
        }}
      />

      {/* Pedestal rim glow — vivid purple ring */}
      <div
        aria-hidden
        className="absolute left-1/2 -z-10"
        style={{
          bottom: "48px",
          transform: "translateX(-50%)",
          width: "320px",
          height: "70px",
          background:
            "radial-gradient(ellipse 100% 100% at 50% 26%, rgba(124,77,255,0.98) 0%, rgba(109,40,217,0.64) 34%, transparent 66%)",
          filter: "blur(13px)",
          borderRadius: "50%",
        }}
      />

      {/* Floor glow — medium spread */}
      <div
        aria-hidden
        className="absolute left-1/2 -z-10"
        style={{
          bottom: "4px",
          transform: "translateX(-50%)",
          width: "420px",
          height: "110px",
          background:
            "radial-gradient(ellipse 100% 100% at 50% 0%, rgba(109,40,217,0.72) 0%, rgba(88,28,135,0.34) 42%, transparent 70%)",
          filter: "blur(24px)",
          borderRadius: "50%",
        }}
      />

      {/* Floor glow — wide outer haze */}
      <div
        aria-hidden
        className="absolute left-1/2 -z-10"
        style={{
          bottom: "-28px",
          transform: "translateX(-50%)",
          width: "580px",
          height: "160px",
          background:
            "radial-gradient(ellipse 100% 100% at 50% 0%, rgba(124,77,255,0.30) 0%, transparent 68%)",
          filter: "blur(32px)",
          borderRadius: "50%",
        }}
      />

      {/* ── SUPPORTING OBJECTS ──────────────────────────────────────────────
          lg+: ID Card (right) + Wallet (left).
          xl+: Backpack (left, higher up) replaces Wallet which moves right.
          All use proper illustrated SVG artwork with gradients, shadows,
          and material detail. Objects sit at pedestal level and never
          increase layout width — they extend into the padding zone only. */}

      {/* IITM ID Card — right side, portrait orientation, clockwise tilt */}
      <div
        aria-hidden
        className="absolute hidden lg:block"
        style={{
          bottom: "68px",
          right: "-42px",
          transform: "rotate(16deg)",
          filter:
            "drop-shadow(0 12px 24px rgba(0,0,0,0.64)) drop-shadow(0 4px 10px rgba(30,58,138,0.40))",
          opacity: 0.94,
        }}
      >
        <svg viewBox="0 0 52 66" fill="none" style={{ width: "62px", height: "78px" }}>
          <defs>
            <linearGradient id="ext-id-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E3A8A" />
              <stop offset="55%" stopColor="#1D4ED8" />
              <stop offset="100%" stopColor="#1E40AF" />
            </linearGradient>
            <linearGradient id="ext-id-hdr" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1E3A8A" />
              <stop offset="50%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#1E3A8A" />
            </linearGradient>
            <linearGradient id="ext-id-gold" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#92400E" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#92400E" />
            </linearGradient>
            <linearGradient id="ext-id-photo" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#CBD5E1" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>
          </defs>
          {/* Card body */}
          <rect x="2" y="2" width="48" height="62" rx="5" fill="url(#ext-id-bg)" />
          {/* White header */}
          <rect x="2" y="2" width="48" height="15" rx="5" fill="rgba(255,255,255,0.95)" />
          <rect x="2" y="11" width="48" height="6" fill="rgba(255,255,255,0.95)" />
          {/* Logo circle in header */}
          <circle cx="10" cy="8.5" r="4.5" fill="url(#ext-id-hdr)" />
          <circle cx="10" cy="8.5" r="2.2" fill="rgba(255,255,255,0.25)" />
          <rect x="9.2" y="6.8" width="1.6" height="3.4" rx="0.4" fill="rgba(255,255,255,0.88)" />
          <rect x="8.2" y="9.2" width="3.6" height="1" rx="0.3" fill="rgba(255,255,255,0.88)" />
          {/* IIT MADRAS text */}
          <rect x="17" y="6" width="30" height="2.2" rx="1.1" fill="rgba(30,64,175,0.75)" />
          <rect x="19" y="9.2" width="24" height="1.6" rx="0.8" fill="rgba(30,64,175,0.45)" />
          {/* Gold stripe */}
          <rect x="2" y="17" width="48" height="3.5" fill="url(#ext-id-gold)" />
          {/* Photo area */}
          <rect x="5" y="24" width="16" height="20" rx="3" fill="url(#ext-id-photo)" />
          <circle cx="13" cy="30" r="4.5" fill="rgba(71,85,105,0.72)" />
          <path d="M5.5 44c0-4.14 3.36-7.5 7.5-7.5s7.5 3.36 7.5 7.5" fill="rgba(71,85,105,0.55)" />
          <rect
            x="5"
            y="24"
            width="16"
            height="20"
            rx="3"
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="0.8"
          />
          {/* Info lines */}
          <rect x="24" y="24" width="23" height="2.5" rx="1.25" fill="rgba(255,255,255,0.90)" />
          <rect x="24" y="28.5" width="16" height="2" rx="1" fill="rgba(255,255,255,0.55)" />
          <rect x="24" y="32" width="20" height="2" rx="1" fill="rgba(255,255,255,0.45)" />
          <rect x="24" y="35.5" width="12" height="2" rx="1" fill="rgba(255,255,255,0.35)" />
          {/* IITM badge */}
          <rect
            x="24"
            y="39"
            width="22"
            height="6"
            rx="2"
            fill="rgba(245,158,11,0.22)"
            stroke="rgba(245,158,11,0.42)"
            strokeWidth="0.6"
          />
          <rect x="26" y="41" width="10" height="1.5" rx="0.75" fill="rgba(245,158,11,0.85)" />
          <rect x="26" y="43.2" width="7" height="1" rx="0.5" fill="rgba(245,158,11,0.60)" />
          {/* Barcode */}
          <rect x="5" y="48" width="42" height="10" rx="2" fill="rgba(255,255,255,0.07)" />
          {Array.from({ length: 22 }, (_, i) => (
            <rect
              key={`ext-bc-${i}`}
              x={6.5 + i * 1.82}
              y="49"
              width={i % 4 === 0 ? 0.7 : 1.1}
              height="7"
              rx="0.2"
              fill="rgba(255,255,255,0.70)"
            />
          ))}
          {/* Lanyard hole */}
          <circle cx="26" cy="2" r="2.5" fill="rgba(0,0,0,0.40)" />
          <circle cx="26" cy="2" r="1.5" fill="rgba(0,0,0,0.60)" />
          {/* Card shine overlay */}
          <rect x="2" y="2" width="48" height="5" rx="5" fill="rgba(255,255,255,0.10)" />
          <rect x="2" y="2" width="8" height="62" rx="5" fill="rgba(255,255,255,0.05)" />
        </svg>
      </div>

      {/* Leather Wallet — lower-left, landscape orientation, counter-clockwise tilt */}
      <div
        aria-hidden
        className="absolute hidden lg:block"
        style={{
          bottom: "74px",
          left: "-32px",
          transform: "rotate(-13deg)",
          filter:
            "drop-shadow(0 12px 22px rgba(0,0,0,0.62)) drop-shadow(0 4px 10px rgba(70,35,10,0.38))",
          opacity: 0.92,
        }}
      >
        <svg viewBox="0 0 72 50" fill="none" style={{ width: "74px", height: "51px" }}>
          <defs>
            <linearGradient id="ext-wb-face" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A0682E" />
              <stop offset="45%" stopColor="#7D4C1C" />
              <stop offset="100%" stopColor="#4E2D0A" />
            </linearGradient>
            <linearGradient id="ext-wb-shine" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </linearGradient>
            <linearGradient id="ext-wb-spine" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3A1A05" />
              <stop offset="50%" stopColor="#7D4C1C" />
              <stop offset="100%" stopColor="#3A1A05" />
            </linearGradient>
            <linearGradient id="ext-wb-card" x1="0%" y1="0%" x2="100%" y2="80%">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#1E3A8A" />
            </linearGradient>
            <linearGradient id="ext-wb-cash" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4ADE80" />
              <stop offset="100%" stopColor="#16A34A" />
            </linearGradient>
          </defs>
          {/* Wallet body */}
          <rect x="3" y="5" width="66" height="38" rx="6" fill="url(#ext-wb-face)" />
          <rect x="3" y="5" width="66" height="38" rx="6" fill="url(#ext-wb-shine)" />
          {/* Spine */}
          <rect x="33.5" y="5" width="5" height="38" fill="url(#ext-wb-spine)" />
          <rect x="35" y="5" width="1.5" height="38" fill="rgba(255,255,255,0.10)" />
          {/* Credit card slot left */}
          <rect x="5" y="7" width="26" height="18" rx="3" fill="url(#ext-wb-card)" />
          <rect x="8" y="10" width="7" height="5" rx="1.2" fill="rgba(255,210,80,0.88)" />
          <rect x="9.5" y="11.2" width="4" height="0.9" rx="0.45" fill="rgba(180,140,20,0.68)" />
          <rect x="9.5" y="12.6" width="4" height="0.9" rx="0.45" fill="rgba(180,140,20,0.68)" />
          {[17, 21, 25, 29].map((x) => (
            <circle key={`ext-wc-${x}`} cx={x} cy="16.5" r="1" fill="rgba(255,255,255,0.58)" />
          ))}
          <rect x="5" y="7" width="26" height="5" rx="3" fill="rgba(255,255,255,0.13)" />
          {/* Second card peeking */}
          <rect x="5" y="27" width="26" height="14" rx="3" fill="rgba(0,0,0,0.22)" />
          <rect x="7" y="29" width="16" height="1.2" rx="0.6" fill="rgba(255,255,255,0.24)" />
          <rect x="7" y="31.5" width="12" height="1" rx="0.5" fill="rgba(255,255,255,0.16)" />
          {/* Cash note */}
          <rect x="38" y="5" width="28" height="7" rx="3" fill="url(#ext-wb-cash)" />
          <rect x="40" y="7.5" width="14" height="1" rx="0.5" fill="rgba(255,255,255,0.32)" />
          <rect x="38" y="12" width="28" height="29" rx="3" fill="rgba(0,0,0,0.16)" />
          <rect x="40" y="16" width="20" height="1.5" rx="0.75" fill="rgba(255,255,255,0.20)" />
          <rect x="40" y="19" width="14" height="1.2" rx="0.6" fill="rgba(255,255,255,0.14)" />
          <rect x="40" y="22" width="18" height="1.2" rx="0.6" fill="rgba(255,255,255,0.11)" />
          {/* Stitching */}
          {Array.from({ length: 12 }, (_, i) => (
            <rect
              key={`ext-wst-${i}`}
              x={5 + i * 5.6}
              y="5.5"
              width="2.2"
              height="0.9"
              rx="0.45"
              fill="rgba(255,215,150,0.24)"
            />
          ))}
          {Array.from({ length: 12 }, (_, i) => (
            <rect
              key={`ext-wsb-${i}`}
              x={5 + i * 5.6}
              y="41.5"
              width="2.2"
              height="0.9"
              rx="0.45"
              fill="rgba(255,215,150,0.18)"
            />
          ))}
          <rect x="3" y="39" width="66" height="4" rx="6" fill="rgba(0,0,0,0.18)" />
        </svg>
      </div>

      {/* Campus Backpack — xl+ only, right side higher up.
          IITM navy blue with realistic straps, pocket, zipper detail. */}
      <div
        aria-hidden
        className="absolute hidden xl:block"
        style={{
          bottom: "108px",
          right: "-50px",
          transform: "rotate(10deg)",
          filter:
            "drop-shadow(0 14px 28px rgba(0,0,0,0.66)) drop-shadow(0 5px 12px rgba(20,40,120,0.40))",
          opacity: 0.88,
        }}
      >
        <svg viewBox="0 0 80 102" fill="none" style={{ width: "68px", height: "86px" }}>
          <defs>
            <linearGradient id="ext-bp-main" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E3A6E" />
              <stop offset="58%" stopColor="#162C56" />
              <stop offset="100%" stopColor="#0E1E3C" />
            </linearGradient>
            <linearGradient id="ext-bp-face" x1="18%" y1="0%" x2="82%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </linearGradient>
            <linearGradient id="ext-bp-pocket" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#162C56" />
              <stop offset="100%" stopColor="#0C1A38" />
            </linearGradient>
            <linearGradient id="ext-bp-strap" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#162C56" />
              <stop offset="50%" stopColor="#1E3A6E" />
              <stop offset="100%" stopColor="#162C56" />
            </linearGradient>
            <linearGradient id="ext-bp-zip" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7A7A8C" />
              <stop offset="50%" stopColor="#C0C0D0" />
              <stop offset="100%" stopColor="#7A7A8C" />
            </linearGradient>
          </defs>
          {/* Main body */}
          <rect x="8" y="16" width="56" height="74" rx="10" fill="url(#ext-bp-main)" />
          <rect x="8" y="16" width="56" height="74" rx="10" fill="url(#ext-bp-face)" />
          {/* Top handle */}
          <path
            d="M30 16 Q30 7 36 7 Q42 7 42 16"
            stroke="url(#ext-bp-strap)"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M30 16 Q30 9.5 36 9.5 Q42 9.5 42 16"
            stroke="rgba(255,255,255,0.14)"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          {/* Main top zipper */}
          <path
            d="M12 23 Q36 19 60 23"
            stroke="url(#ext-bp-zip)"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />
          {/* Zipper pull tab */}
          <rect x="33" y="20.5" width="6" height="4.5" rx="1.5" fill="#A0A0B4" />
          <rect x="34.5" y="21.5" width="3" height="2.5" rx="0.8" fill="#C8C8D8" />
          {/* Front pocket */}
          <rect x="13" y="36" width="46" height="42" rx="7" fill="url(#ext-bp-pocket)" />
          {/* Pocket zipper */}
          <path
            d="M16 43 Q36 40 57 43"
            stroke="url(#ext-bp-zip)"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
          />
          <rect x="34" y="41" width="5" height="4" rx="1.2" fill="#8E8EA0" />
          {/* Pocket inner seam */}
          <rect x="17" y="47" width="38" height="0.8" rx="0.4" fill="rgba(255,255,255,0.09)" />
          {/* IITM patch area */}
          <rect
            x="20"
            y="52"
            width="32"
            height="20"
            rx="4"
            fill="rgba(255,255,255,0.06)"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="0.8"
          />
          <rect x="23" y="55" width="26" height="2" rx="1" fill="rgba(255,255,255,0.32)" />
          <rect x="25" y="58.5" width="22" height="1.6" rx="0.8" fill="rgba(255,255,255,0.18)" />
          <rect x="27" y="61.5" width="18" height="1.5" rx="0.75" fill="rgba(255,255,255,0.14)" />
          {/* Logo circle on patch */}
          <circle
            cx="36"
            cy="66"
            r="3.5"
            fill="rgba(245,158,11,0.30)"
            stroke="rgba(245,158,11,0.50)"
            strokeWidth="0.7"
          />
          <rect x="35.2" y="64.4" width="1.6" height="3.2" rx="0.4" fill="rgba(245,158,11,0.80)" />
          <rect x="34.2" y="66.6" width="3.6" height="1" rx="0.3" fill="rgba(245,158,11,0.80)" />
          {/* Left shoulder strap */}
          <path
            d="M8 26 Q3 42 5 72 Q6 78 10 80 L12 80 Q10 76 10 70 Q8 44 12 28"
            fill="url(#ext-bp-strap)"
          />
          <path
            d="M9.5 32 Q6 50 7.5 70"
            stroke="rgba(255,255,255,0.11)"
            strokeWidth="1"
            fill="none"
          />
          {/* Right shoulder strap */}
          <path
            d="M64 26 Q69 42 67 72 Q66 78 62 80 L60 80 Q62 76 62 70 Q64 44 60 28"
            fill="url(#ext-bp-strap)"
          />
          <path
            d="M62.5 32 Q66 50 64.5 70"
            stroke="rgba(255,255,255,0.11)"
            strokeWidth="1"
            fill="none"
          />
          {/* Side seam lines */}
          <path
            d="M8 30 Q8.5 56 9 80"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="0.8"
            fill="none"
          />
          <path
            d="M64 30 Q63.5 56 63 80"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="0.8"
            fill="none"
          />
          {/* Top edge specular */}
          <path
            d="M18 17 Q36 15 54 17"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────────────────────── */

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/home");

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <JsonLd data={[faqSchema(HOME_FAQ), breadcrumbSchema([{ name: "Home", path: "/" }])]} />

      {/* ── Global ambient background ─────────────────────────────────── */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.11]"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Purple top glow */}
        <div
          className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/3 rounded-full blur-[140px]"
          style={{
            width: "min(900px, 90vw)",
            height: "680px",
            backgroundColor: "rgba(124,77,255,0.15)",
          }}
        />
        {/* Violet right */}
        <div
          className="absolute hidden rounded-full blur-[110px] lg:block"
          style={{
            right: "-8%",
            top: "30%",
            width: "460px",
            height: "460px",
            backgroundColor: "rgba(139,92,246,0.09)",
          }}
        />
        {/* Orange warm bottom */}
        <div
          className="absolute rounded-full blur-[110px]"
          style={{
            bottom: "-8%",
            left: "-4%",
            width: "400px",
            height: "400px",
            backgroundColor: "rgba(255,122,24,0.06)",
          }}
        />
      </div>

      <div className="relative z-10">
        {/* ── Navigation ──────────────────────────────────────────────── */}
        <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/[0.05] bg-[#050816]/80 backdrop-blur-2xl">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="relative flex h-[30px] w-[30px] items-center justify-center overflow-hidden rounded-[9px] ring-1 ring-white/10">
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(135deg, #7C4DFF, #5B21B6)" }}
                />
                <Image
                  src="/favicon-96x96.png"
                  alt="Findora"
                  width={30}
                  height={30}
                  priority
                  className="relative z-10"
                />
              </div>
              <span className="text-[15px] font-bold tracking-tight text-white">Findora</span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/about"
                className="hidden text-[13px] font-medium text-white/55 transition-colors hover:text-white sm:inline-block"
              >
                About
              </Link>
              <Link
                href="/login"
                className="hidden text-[13px] font-medium text-white/55 transition-colors hover:text-white sm:inline-block"
              >
                Sign in
              </Link>
              <Link
                href="/login"
                className="group inline-flex items-center gap-1.5 rounded-[10px] px-3.5 py-1.5 text-[13px] font-semibold text-white transition-all hover:-translate-y-px sm:px-4"
                style={{
                  background: "#7C4DFF",
                  boxShadow: "0 4px 16px rgba(124,77,255,0.45)",
                }}
              >
                Get started
                <ArrowRight
                  size={13}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </div>
        </nav>

        {/* ══════════════════════════════════════════════════════════════
            HERO
            Mobile:  text only, no phone mockup, comfortable px-6 padding
            Desktop: equal 50/50 grid, phone right with 3D tilt
        ══════════════════════════════════════════════════════════════ */}
        <section className="relative flex min-h-[calc(100vh-56px)] items-center px-6 pb-10 pt-20 sm:px-8 sm:pb-14 sm:pt-28 md:min-h-[64vh] md:pb-20 md:pt-14 lg:px-10 lg:pb-16 lg:pt-32 xl:min-h-[calc(100vh-56px)] xl:px-14 xl:pb-20 xl:pt-40">
          {/* max-w-7xl gives headline enough column width at 56px cap.
              1.1fr/0.9fr slightly favors the text column so the headline
              never needs whitespace-nowrap to fight for space.
              Two columns start at md (768px) so the phone never stacks
              below the headline — it either sits beside it or is hidden. */}
          <div className="mx-auto w-full max-w-7xl">
            {/* Two-column grid only at lg (1024px+).
                Below that: phone hidden, text fills full width.
                This prevents the phone from appearing on Nest Hub, foldables,
                small landscape tablets, and split-screen windows where the
                two-column layout cannot fit both the headline and the mockup
                without compression or stacking. */}
            <div className="grid items-center gap-8 sm:gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-6 xl:gap-8">
              {/* ── Left / Top: Text content ───────────────────────── */}
              {/* Always first in DOM = top on mobile, left on desktop */}
              <div className="text-center md:text-left">
                {/* Eyebrow badge */}
                <div
                  className="mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-[5px] text-[11px] font-semibold tracking-wide backdrop-blur-md sm:mb-6"
                  style={{
                    borderColor: "rgba(255,122,24,0.25)",
                    backgroundColor: "rgba(255,122,24,0.08)",
                    color: "#FDBA74",
                  }}
                >
                  <span className="relative flex h-[7px] w-[7px]">
                    <span
                      className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                      style={{ backgroundColor: "#FF7A18" }}
                    />
                    <span
                      className="relative inline-flex h-[7px] w-[7px] rounded-full"
                      style={{ backgroundColor: "#FF7A18" }}
                    />
                  </span>
                  IITM Campus Platform
                </div>

                <h1 className="text-[clamp(36px,10.4vw,56px)] font-bold leading-[1.15] tracking-[-0.035em] md:leading-[1.06] lg:text-[clamp(56px,5vw,64px)]">
                  Find what&apos;s{" "}
                  <span
                    className="bg-clip-text text-transparent"
                    style={{
                      backgroundImage:
                        "linear-gradient(135deg, #C4B5FD 0%, #A78BFA 40%, #7C4DFF 100%)",
                    }}
                  >
                    lost
                  </span>
                  .
                  <br />
                  <span className="whitespace-normal md:whitespace-nowrap">
                    Return what&apos;s{" "}
                    <span
                      className="bg-clip-text text-transparent"
                      style={{
                        backgroundImage:
                          "linear-gradient(135deg, #6EE7B7 0%, #34D399 50%, #059669 100%)",
                      }}
                    >
                      found
                    </span>
                    .
                  </span>
                </h1>

                {/* Subtitle — more breathing room below headline */}
                <p className="mx-auto mt-6 max-w-[320px] text-[14px] leading-[1.7] text-white/50 sm:text-[15px] md:mx-0 md:mt-8 md:max-w-[38ch] lg:text-[16px]">
                  A secure, centralized platform replacing scattered WhatsApp groups — verified with
                  your IITM student identity.
                </p>

                {/* CTAs — primary dominates, secondary recedes */}
                <div className="mx-auto mt-6 flex w-full max-w-[320px] flex-col gap-3 md:mx-0 md:mt-9 md:w-auto md:max-w-none md:flex-row md:gap-3">
                  {/* Primary — strongest visual weight */}
                  <Link
                    href="/login"
                    className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl px-7 py-3.5 text-[14px] font-semibold text-white transition-all hover:-translate-y-[2px] sm:text-[15px]"
                    style={{
                      background: "linear-gradient(135deg, #7C4DFF 0%, #6D28D9 55%, #5B21B6 100%)",
                      boxShadow:
                        "0 12px 28px rgba(124,77,255,0.50), 0 4px 8px rgba(124,77,255,0.25), inset 0 1px 0 rgba(255,255,255,0.20)",
                    }}
                  >
                    <span className="absolute inset-0 bg-gradient-to-t from-transparent to-white/[0.10]" />
                    <span className="relative">Sign in with Google</span>
                    <ArrowRight
                      size={15}
                      className="relative transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>
                  {/* Secondary — outline, lower emphasis */}
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.14] bg-white/[0.04] px-7 py-3.5 text-[14px] font-semibold text-white/70 backdrop-blur-sm transition-all hover:border-white/[0.22] hover:bg-white/[0.08] hover:text-white sm:text-[15px]"
                  >
                    Browse platform
                  </Link>
                </div>

                {/* Trust signals */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 md:mt-5 md:justify-start">
                  {["IITM verified accounts", "Secure messaging", "Free for students"].map((t) => (
                    <span key={t} className="flex items-center gap-[5px] text-[11px] text-white/40">
                      <CheckCircle2 size={10} className="text-emerald-400/60" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* ── Right: Phone mockup — hidden on mobile, visible md+ ─── */}
              {/* Hidden below 768px: mobile users see only the text CTA.
                  On tablet/desktop: full 3D device in the right column. */}
              <div className="hidden lg:flex lg:items-center lg:justify-center">
                <PhoneMockup />
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats strip ─────────────────────────────────────────────── */}
        <section className="px-4 pb-10 sm:px-6 sm:pb-14 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div
              className="grid grid-cols-3 overflow-hidden rounded-2xl border"
              style={{
                borderColor: "rgba(255,255,255,0.07)",
                backgroundColor: "rgba(255,255,255,0.025)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
              }}
            >
              {[
                {
                  Icon: Zap,
                  title: "Average Recovery",
                  value: "<48h",
                  iconColor: "#FF7A18",
                },
                {
                  Icon: CheckCircle2,
                  title: "Resolution Rate",
                  value: "80%+",
                  iconColor: "#7C4DFF",
                },
                {
                  Icon: Shield,
                  title: "Verified Accounts",
                  value: "100%",
                  iconColor: "#22C55E",
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1 px-3 py-5 text-center sm:gap-1.5 sm:px-4 sm:py-6"
                  style={i > 0 ? { borderLeft: "1px solid rgba(255,255,255,0.06)" } : undefined}
                >
                  <stat.Icon size={14} style={{ color: stat.iconColor }} />
                  <div className="text-white/38 text-[9.5px] font-semibold tracking-wide sm:text-[10.5px]">
                    {stat.title}
                  </div>
                  <div className="text-[20px] font-bold tracking-tight text-white sm:text-[24px] lg:text-[28px]">
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Workflow ────────────────────────────────────────────────── */}
        <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 text-center sm:mb-14">
              <div
                className="mb-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-[5px] text-[10.5px] font-semibold uppercase tracking-[0.15em]"
                style={{
                  borderColor: "rgba(255,255,255,0.08)",
                  backgroundColor: "rgba(255,255,255,0.03)",
                  color: "rgba(255,255,255,0.50)",
                }}
              >
                How it works
              </div>
              <h2 className="text-[22px] font-bold tracking-[-0.022em] text-white sm:text-[28px] lg:text-[32px]">
                Report → Find → Notify → Return
              </h2>
              <p className="mt-2 text-[13px] text-white/40 sm:text-sm">
                Four steps from lost to recovered.
              </p>
            </div>

            <div className="relative grid grid-cols-2 gap-5 sm:gap-6 lg:grid-cols-4 lg:gap-0">
              {/* Dashed connecting line — desktop only */}
              <div
                aria-hidden
                className="absolute left-[12.5%] right-[12.5%] top-[34px] hidden h-px lg:block"
                style={{
                  background:
                    "repeating-linear-gradient(to right, rgba(124,77,255,0.35) 0, rgba(124,77,255,0.35) 5px, transparent 5px, transparent 10px)",
                }}
              />

              {(
                [
                  {
                    num: 1,
                    Icon: Package,
                    title: "Report",
                    desc: "Post a lost or found item with photos, location, and description.",
                    numEnd: "#7C4DFF",
                  },
                  {
                    num: 2,
                    Icon: Search,
                    title: "Find",
                    desc: "Smart search surfaces matches by category, keyword, and location.",
                    numEnd: "#9B7AFF",
                  },
                  {
                    num: 3,
                    Icon: Bell,
                    title: "Notify",
                    desc: "Message the owner or finder privately. No numbers shared.",
                    numEnd: "#B59FFF",
                  },
                  {
                    num: 4,
                    Icon: CheckCircle2,
                    title: "Return",
                    desc: "Mark recovered. Case closed, community helped.",
                    numEnd: "#22C55E",
                  },
                ] as const
              ).map((step) => (
                <div
                  key={step.num}
                  className="relative flex flex-col items-center px-1 text-center lg:px-4"
                >
                  <div
                    className="relative mb-4 flex h-[68px] w-[68px] items-center justify-center rounded-[22px] border"
                    style={{
                      borderColor: "rgba(255,255,255,0.08)",
                      backgroundColor: "rgba(255,255,255,0.035)",
                    }}
                  >
                    <step.Icon size={22} className="text-white/55" />
                    <div
                      className="absolute -right-2 -top-2 flex h-[22px] w-[22px] items-center justify-center rounded-full text-[10px] font-black text-white"
                      style={{
                        background: `linear-gradient(135deg, #7C4DFF, ${step.numEnd})`,
                        boxShadow: "0 4px 12px rgba(124,77,255,0.5)",
                      }}
                    >
                      {step.num}
                    </div>
                  </div>
                  <h3 className="mb-1.5 text-[14px] font-bold tracking-tight text-white sm:text-[15px]">
                    {step.title}
                  </h3>
                  <p className="text-white/42 max-w-[22ch] text-[12px] leading-relaxed sm:text-[12.5px]">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ────────────────────────────────────────────────── */}
        <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 text-center sm:mb-12">
              <h2 className="text-[22px] font-bold tracking-[-0.022em] text-white sm:text-[28px] lg:text-[32px]">
                Everything you need to recover what matters
              </h2>
              <p className="text-white/42 mx-auto mt-2.5 max-w-[44ch] text-[13px] sm:text-sm">
                Designed for the pace of campus life — fast, private, and structured.
              </p>
            </div>

            {/* 2 large hero cards */}
            <div className="mb-4 grid gap-4 sm:grid-cols-2">
              <div
                className="rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-0.5 sm:p-7"
                style={{
                  borderColor: "rgba(255,255,255,0.07)",
                  backgroundColor: "rgba(255,255,255,0.025)",
                }}
              >
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: "rgba(124,77,255,0.14)", color: "#C4B5FD" }}
                >
                  <Shield size={22} />
                </div>
                <h3 className="mb-2.5 text-[17px] font-bold tracking-tight text-white sm:text-[18px]">
                  Verified Identity
                </h3>
                <p className="text-[13px] leading-relaxed text-white/50 sm:text-[13.5px]">
                  IITM student accounts only, verified via Google OAuth. No anonymous users, no fake
                  reports. Every listing is from a real student you share a campus with.
                </p>
              </div>
              <div
                className="rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-0.5 sm:p-7"
                style={{
                  borderColor: "rgba(255,255,255,0.07)",
                  backgroundColor: "rgba(255,255,255,0.025)",
                }}
              >
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: "rgba(139,92,246,0.14)", color: "#DDD6FE" }}
                >
                  <MessageCircle size={22} />
                </div>
                <h3 className="mb-2.5 text-[17px] font-bold tracking-tight text-white sm:text-[18px]">
                  Private Messaging
                </h3>
                <p className="text-[13px] leading-relaxed text-white/50 sm:text-[13.5px]">
                  Owner and finder connect through secure in-app conversations. No phone numbers
                  shared publicly — private, direct, restricted to participants only.
                </p>
              </div>
            </div>

            {/* 4 compact cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {(
                [
                  {
                    Icon: Zap,
                    title: "Instant Matching",
                    desc: "Smart search across title, category, and location.",
                    iconBg: "rgba(255,122,24,0.12)",
                    iconColor: "#FDBA74",
                  },
                  {
                    Icon: MapPin,
                    title: "Location Context",
                    desc: "Log where items were lost or found on campus.",
                    iconBg: "rgba(16,185,129,0.12)",
                    iconColor: "#6EE7B7",
                  },
                  {
                    Icon: CheckCircle2,
                    title: "Full Lifecycle",
                    desc: "Track items from report to recovery end-to-end.",
                    iconBg: "rgba(20,184,166,0.12)",
                    iconColor: "#5EEAD4",
                  },
                  {
                    Icon: Package,
                    title: "Rich Reports",
                    desc: "Up to 5 photos per listing with full details.",
                    iconBg: "rgba(244,63,94,0.12)",
                    iconColor: "#FDA4AF",
                  },
                ] as const
              ).map((f, i) => (
                <div
                  key={i}
                  className="rounded-2xl border p-4 transition-all hover:-translate-y-0.5 sm:p-5"
                  style={{
                    borderColor: "rgba(255,255,255,0.06)",
                    backgroundColor: "rgba(255,255,255,0.02)",
                  }}
                >
                  <div
                    className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ backgroundColor: f.iconBg, color: f.iconColor }}
                  >
                    <f.Icon size={16} />
                  </div>
                  <h3 className="mb-1 text-[13px] font-semibold text-white">{f.title}</h3>
                  <p className="text-white/42 text-[11.5px] leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Trust ───────────────────────────────────────────────────── */}
        <section className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-5xl">
            <div
              className="relative overflow-hidden rounded-3xl border p-8 sm:p-12"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                background: "linear-gradient(135deg, #090D1F 0%, #0D0B1E 60%, #100D20 100%)",
              }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.035]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(124,77,255,1) 1px, transparent 1px), linear-gradient(to right, rgba(124,77,255,1) 1px, transparent 1px)",
                  backgroundSize: "36px 36px",
                }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full blur-[80px]"
                style={{ backgroundColor: "rgba(124,77,255,0.13)" }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full blur-[80px]"
                style={{ backgroundColor: "rgba(255,122,24,0.07)" }}
              />
              <div className="relative grid gap-8 sm:grid-cols-[1.2fr_1fr] sm:gap-12">
                <div>
                  <div
                    className="mb-4 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[5px] text-[10px] font-bold uppercase tracking-[0.15em]"
                    style={{
                      borderColor: "rgba(124,77,255,0.25)",
                      backgroundColor: "rgba(124,77,255,0.10)",
                      color: "#C4B5FD",
                    }}
                  >
                    <Shield size={10} />
                    Security First
                  </div>
                  <h2 className="text-[20px] font-bold tracking-[-0.02em] text-white sm:text-[24px]">
                    Built for trust, not just convenience
                  </h2>
                  <p className="mt-3 max-w-[42ch] text-[13px] leading-relaxed text-white/50 sm:text-[13.5px]">
                    Every user is a verified IITM student. Row-level security ensures you only see
                    what you&apos;re authorized to. No public listings, no anonymous messages.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: "Domain restricted", sub: "IITM student accounts only" },
                    { label: "End-to-end verified", sub: "Google OAuth identity" },
                    { label: "Private messaging", sub: "Owner + finder only" },
                    { label: "Admin moderation", sub: "Abuse review & action" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="rounded-xl border p-3"
                      style={{
                        borderColor: "rgba(255,255,255,0.07)",
                        backgroundColor: "rgba(255,255,255,0.03)",
                      }}
                    >
                      <div className="mb-1 flex items-center gap-1.5">
                        <CheckCircle2 size={10} style={{ color: "#7C4DFF" }} />
                        <span className="text-[11px] font-semibold text-white/80">
                          {item.label}
                        </span>
                      </div>
                      <p className="text-white/36 text-[10.5px] leading-snug">{item.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Final CTA ───────────────────────────────────────────────── */}
        <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="relative mx-auto max-w-2xl text-center">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 -top-10 h-[280px]"
              style={{
                background:
                  "radial-gradient(ellipse 55% 65% at 50% 50%, rgba(124,77,255,0.18), transparent 70%)",
              }}
            />
            <h2 className="relative text-[22px] font-bold tracking-[-0.022em] text-white sm:text-[28px] lg:text-[32px]">
              Lost something? Found something?
            </h2>
            <p className="relative mx-auto mt-3 max-w-[44ch] text-[13.5px] text-white/45 sm:text-[15px]">
              Join your campus community on Findora. It only takes a minute.
            </p>
            <div className="relative mt-8">
              <Link
                href="/login"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl px-8 py-3.5 text-[14px] font-semibold text-white transition-all hover:-translate-y-px sm:text-[15px]"
                style={{
                  background: "linear-gradient(135deg, #7C4DFF 0%, #6D28D9 60%, #5B21B6 100%)",
                  boxShadow:
                    "0 12px 28px rgba(124,77,255,0.50), 0 4px 8px rgba(124,77,255,0.25), inset 0 1px 0 rgba(255,255,255,0.20)",
                }}
              >
                <span className="absolute inset-0 bg-gradient-to-t from-transparent to-white/[0.08]" />
                <span className="relative">Get started with Google</span>
                <ArrowRight
                  size={15}
                  className="relative transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>
            <p className="text-white/26 relative mt-4 text-[11.5px]">
              Free to use · No account creation needed
            </p>
          </div>
        </section>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <footer
          className="relative px-4 py-10 sm:px-6 lg:px-8"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row sm:gap-4">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-[7px] ring-1 ring-white/10">
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(135deg, #7C4DFF, #5B21B6)" }}
                />
                <Image
                  src="/favicon-96x96.png"
                  alt="Findora"
                  width={24}
                  height={24}
                  className="relative z-10"
                />
              </div>
              <span className="text-white/72 text-[13px] font-semibold">Findora</span>
              <span className="text-white/22 hidden text-[11px] sm:inline-block">
                &middot; &copy; {new Date().getFullYear()}
              </span>
            </div>
            <nav className="text-white/38 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px]">
              <Link href="/about" className="transition-colors hover:text-white">
                About
              </Link>
              <Link href="/privacy" className="transition-colors hover:text-white">
                Privacy
              </Link>
              <Link href="/terms" className="transition-colors hover:text-white">
                Terms
              </Link>
              <Link href="/contact" className="transition-colors hover:text-white">
                Contact
              </Link>
            </nav>
            <div className="flex items-center gap-1">
              {[
                {
                  href: "https://github.com/RohitPulamarasetty/",
                  label: "GitHub",
                  icon: SOCIAL_ICONS.github,
                },
                {
                  href: "https://www.linkedin.com/in/rohit-kumar-pulamarasetty/",
                  label: "LinkedIn",
                  icon: SOCIAL_ICONS.linkedin,
                },
                {
                  href: "https://x.com/RPulamarasetty",
                  label: "X (Twitter)",
                  icon: SOCIAL_ICONS.twitter,
                },
              ].map(({ href, label, icon }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/34 flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[0.06] hover:text-white"
                >
                  {icon}
                </Link>
              ))}
            </div>
          </div>
          {/* Credit line */}
          <div className="mx-auto mt-6 max-w-7xl text-center">
            <p className="text-white/28 text-[11px]">
              Designed &amp; Developed by <br className="sm:hidden" />
              <a
                href="https://www.linkedin.com/in/rohit-kumar-pulamarasetty/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/42 underline-offset-2 transition-colors hover:text-white/70 hover:underline"
              >
                Rohit Pulamarasetty
              </a>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
