/**
 * Centralized Razorpay Standard Checkout configuration.
 *
 * - Backend uses RAZORPAY_KEY_SECRET (server-only) for order creation
 *   and signature verification.
 * - Frontend uses NEXT_PUBLIC_RAZORPAY_KEY_ID to initialise the
 *   Razorpay checkout modal.
 *
 * Set both in .env.local (gitignored) — see .env.example.
 */
export const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";

export const SUPPORT_CTA_LABEL = "Support Findora";
export const SUPPORT_DESCRIPTION =
  "Support the development of Findora and help improve tools for students and developers.";

export interface SupportPreset {
  label: string;
  amount: number;
  recommended?: boolean;
}

/** Default support tiers shown in the support dialog (paise). */
export const SUPPORT_PRESETS: readonly SupportPreset[] = [
  { label: "₹49", amount: 4900 },
  { label: "₹99", amount: 9900, recommended: true },
  { label: "₹199", amount: 19900 },
  { label: "₹499", amount: 49900 },
];

export const SUPPORT_CURRENCY = "INR";
export const SUPPORT_MIN_AMOUNT_PAISE = 100; // Razorpay minimum
export const SUPPORT_MAX_AMOUNT_PAISE = 5_000_00; // sensible cap (₹5,000)
