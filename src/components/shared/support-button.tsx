"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles, ShieldCheck, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  RAZORPAY_KEY_ID,
  SUPPORT_CTA_LABEL,
  SUPPORT_CURRENCY,
  SUPPORT_MAX_AMOUNT_PAISE,
  SUPPORT_MIN_AMOUNT_PAISE,
  SUPPORT_PRESETS,
} from "@/lib/support";

// ── Razorpay types (minimal surface) ──────────────────────────────
type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayMethodConfig = {
  card?: boolean;
  upi?: boolean;
  netbanking?: boolean;
  wallet?: boolean;
  emi?: boolean;
  paylater?: boolean;
};

type RazorpayPaymentFailedPayload = {
  error: {
    code?: string;
    description?: string;
    source?: string;
    step?: string;
    reason?: string;
    metadata?: { order_id?: string; payment_id?: string };
  };
};

type RazorpayOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  theme?: { color?: string };
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  method?: RazorpayMethodConfig;
  config?: {
    display?: {
      preferences?: { show_default_blocks?: boolean };
      sequence?: string[];
    };
  };
  handler: (response: RazorpayResponse) => void;
  modal?: { ondismiss?: () => void };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: "payment.failed", cb: (response: RazorpayPaymentFailedPayload) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

// ── Script loader ────────────────────────────────────────────────
const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
const SCRIPT_TIMEOUT_MS = 12_000;

function loadCheckoutScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      if (window.Razorpay) {
        finish(true);
        return;
      }
      existing.addEventListener("load", () => finish(!!window.Razorpay));
      existing.addEventListener("error", () => finish(false));
      window.setTimeout(() => finish(!!window.Razorpay), SCRIPT_TIMEOUT_MS);
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => finish(!!window.Razorpay);
    script.onerror = () => finish(false);
    document.body.appendChild(script);

    window.setTimeout(() => finish(!!window.Razorpay), SCRIPT_TIMEOUT_MS);
  });
}

// ── Component ────────────────────────────────────────────────────
interface SupportButtonProps {
  className?: string;
  label?: string;
  /** Custom trigger node — must accept a forwarded onClick. */
  children?: React.ReactNode;
}

export function SupportButton({
  className,
  label = SUPPORT_CTA_LABEL,
  children,
}: SupportButtonProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number>(
    SUPPORT_PRESETS.find((p) => p.recommended)?.amount ?? SUPPORT_PRESETS[0].amount
  );
  const [customRupees, setCustomRupees] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Synchronous lock so a second click/tap cannot queue a parallel request
  // before React re-renders with isProcessing=true (there's a ~1 frame gap).
  const processingRef = useRef(false);

  // Pending checkout opened only after our Dialog has fully closed.
  // Radix Dialog puts pointer-events: none on <body> while open and renders
  // a z-50 overlay — both of which hide Razorpay's modal. We close our
  // dialog first, wait for the next animation frame, then open Razorpay.
  const pendingOptionsRef = useRef<RazorpayOptions | null>(null);

  // Preload the Razorpay script when the dialog opens to reduce delay.
  useEffect(() => {
    if (open) void loadCheckoutScript();
  }, [open]);

  const customPaise = (() => {
    const n = Number(customRupees);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.round(n * 100);
  })();

  const finalAmount = customPaise > 0 ? customPaise : selected;
  const isValidAmount =
    Number.isInteger(finalAmount) &&
    finalAmount >= SUPPORT_MIN_AMOUNT_PAISE &&
    finalAmount <= SUPPORT_MAX_AMOUNT_PAISE;

  /** Actually instantiate Razorpay and open the modal. Called after our
   *  Dialog has closed so Radix releases its body lock + overlay. */
  const launchRazorpay = useCallback((options: RazorpayOptions) => {
    if (typeof window === "undefined" || !window.Razorpay) {
      toast.error("Failed to initialize Razorpay checkout.");
      setIsProcessing(false);
      return;
    }

    try {
      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", (resp) => {
        const e = resp.error ?? {};
        const desc = e.description || "";
        const isInternational =
          /international/i.test(desc) || /international/i.test(e.reason || "");
        const message = isInternational
          ? "International cards are disabled. Use a domestic test card, UPI, or netbanking."
          : desc || "Payment failed. Please try again.";

        toast.error(message);
        setIsProcessing(false);
      });

      rzp.open();
    } catch {
      toast.error("Failed to initialize Razorpay checkout.");
      setIsProcessing(false);
    }
  }, []);

  const handlePay = useCallback(async () => {
    if (!isValidAmount) {
      toast.error("Please enter a valid amount.");
      return;
    }
    if (!RAZORPAY_KEY_ID) {
      toast.error("Payments are not configured. Please try again later.");
      return;
    }
    // Synchronous lock — blocks a second click before React re-renders.
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);

    try {
      // 1) Make sure the SDK is ready BEFORE we close our dialog so we
      //    don't leave the user staring at a closed dialog and nothing.
      const ok = await loadCheckoutScript();
      if (!ok || !window.Razorpay) {
        toast.error("Could not load the payment SDK. Check your connection and try again.");
        processingRef.current = false;
        setIsProcessing(false);
        return;
      }

      // 2) Create order on the server
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          currency: SUPPORT_CURRENCY,
          receipt: `findora_${Date.now()}`,
        }),
      });

      if (!orderRes.ok) {
        const data = (await orderRes.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error || "Could not start payment. Please try again.");
        processingRef.current = false;
        setIsProcessing(false);
        return;
      }

      const order = (await orderRes.json()) as {
        order_id?: string;
        amount?: number;
        currency?: string;
      };

      if (!order.order_id || typeof order.amount !== "number" || !order.currency) {
        toast.error("Failed to initialize Razorpay checkout.");
        processingRef.current = false;
        setIsProcessing(false);
        return;
      }

      // 3) Prepare options. Defer the actual rzp.open() until our Dialog
      //    has closed (see effect below) — otherwise Radix's overlay and
      //    body pointer-events lock hide the Razorpay modal.
      pendingOptionsRef.current = {
        key: RAZORPAY_KEY_ID,
        order_id: order.order_id,
        amount: order.amount,
        currency: order.currency, // INR — enforced server-side
        name: "Findora",
        description: "Support the development of Findora",
        image: "/favicon-96x96.png",
        theme: { color: "#4170FF" },
        notes: { source: "findora_support" },
        // Explicitly enable domestic payment methods. EMI/Pay-Later are
        // off — they sometimes route through international card rails.
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
          emi: false,
          paylater: false,
        },
        // Show Razorpay's default L1 block layout so the UPI block renders
        // with Collect (enter UPI ID), Intent (app launch on mobile), and
        // QR sub-tabs. Do NOT pass `sequence` — restricting blocks collapses
        // UPI into a single QR-only widget.
        config: {
          display: {
            preferences: { show_default_blocks: true },
          },
        },
        modal: {
          ondismiss: () => {
            processingRef.current = false;
            setIsProcessing(false);
          },
        },
        handler: async (response) => {
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            if (!verifyRes.ok) {
              const data = (await verifyRes.json().catch(() => ({}))) as { error?: string };
              toast.error(data.error || "Payment could not be verified.");
              return;
            }
            toast.success("Thank you for supporting Findora!");
          } catch {
            toast.error("Payment verification failed. Please contact support if charged.");
          } finally {
            processingRef.current = false;
            setIsProcessing(false);
          }
        },
      };

      // 4) Close our dialog — the effect below will fire rzp.open() once
      //    Radix has cleaned up. We also have a safety timer in case the
      //    close event never fires.
      setOpen(false);
      window.setTimeout(() => {
        if (pendingOptionsRef.current) {
          const opts = pendingOptionsRef.current;
          pendingOptionsRef.current = null;
          launchRazorpay(opts);
        }
      }, 400);
    } catch {
      toast.error("Failed to initialize Razorpay checkout.");
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [finalAmount, isValidAmount, launchRazorpay]);

  // Fire pending checkout once our dialog finishes closing.
  useEffect(() => {
    if (open) return;
    if (!pendingOptionsRef.current) return;
    const opts = pendingOptionsRef.current;
    pendingOptionsRef.current = null;
    // Two RAFs to let Radix complete unmount + body cleanup.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => launchRazorpay(opts));
    });
  }, [open, launchRazorpay]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <button
            type="button"
            className={cn(
              "group relative inline-flex items-center gap-2 overflow-hidden rounded-xl px-6 py-3 text-[13.5px] font-semibold text-white shadow-[0_8px_24px_rgb(var(--color-brand-500)/0.35),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all hover:-translate-y-px hover:shadow-[0_12px_32px_rgb(var(--color-brand-500)/0.5),inset_0_1px_0_rgba(255,255,255,0.25)]",
              className
            )}
          >
            <span className="absolute inset-0 bg-gradient-to-br from-brand-500 via-brand-600 to-accentc-600" />
            <span className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />
            <Sparkles size={14} className="relative" />
            <span className="relative">{label}</span>
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[18px]">Support Findora</DialogTitle>
          <DialogDescription>
            Pick an amount. Contributions help cover hosting and future improvements for students
            and developers.
          </DialogDescription>
        </DialogHeader>

        {/* Amount presets */}
        <div className="grid grid-cols-4 gap-2">
          {SUPPORT_PRESETS.map((preset) => {
            const isActive = customPaise === 0 && selected === preset.amount;
            return (
              <button
                key={preset.amount}
                type="button"
                onClick={() => {
                  setSelected(preset.amount);
                  setCustomRupees("");
                }}
                className={cn(
                  "relative flex h-12 items-center justify-center rounded-xl border text-[13.5px] font-semibold transition-all duration-200",
                  isActive
                    ? "border-brand-500/60 bg-gradient-to-br from-brand-500/15 to-accentc-500/10 text-brand-600 shadow-[0_4px_14px_rgb(var(--color-brand-500)/0.2)] dark:text-brand-300"
                    : "border-border-default bg-bg-subtle/60 text-text-secondary hover:border-border-strong hover:bg-bg-subtle"
                )}
                aria-pressed={isActive}
              >
                {preset.label}
                {preset.recommended && (
                  <span className="absolute -top-2 right-1 inline-flex items-center gap-0.5 rounded-full bg-gradient-to-br from-brand-500 to-accentc-500 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-white shadow">
                    <Check size={8} strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Custom amount */}
        <div>
          <label
            htmlFor="custom-amount"
            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted-fg"
          >
            Or enter a custom amount
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-semibold text-text-muted-fg">
              ₹
            </span>
            <Input
              id="custom-amount"
              type="number"
              inputMode="decimal"
              min={1}
              step="1"
              placeholder="0"
              value={customRupees}
              onChange={(e) => setCustomRupees(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-1">
          <p className="inline-flex items-center gap-1.5 text-[11px] text-text-muted-fg">
            <ShieldCheck size={11} className="text-emerald-500" />
            Secured by Razorpay · UPI, cards &amp; net banking supported
          </p>
          <Button
            type="button"
            size="lg"
            onClick={() => void handlePay()}
            disabled={!isValidAmount || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Opening secure checkout…
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Pay ₹{(finalAmount / 100).toLocaleString("en-IN")} securely
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
