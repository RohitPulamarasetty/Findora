import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { SUPPORT_MIN_AMOUNT_PAISE, SUPPORT_MAX_AMOUNT_PAISE } from "@/lib/support";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/utils/supabase/server";
import { checkDedup, storeDedup } from "@/lib/request-dedup";

export const runtime = "nodejs";

interface CreateOrderBody {
  amount?: unknown;
  currency?: unknown;
  receipt?: unknown;
}

export async function POST(request: Request) {
  // Require a valid IITM student session before touching Razorpay's API.
  // This prevents anonymous actors from exhausting Razorpay order quotas
  // or inflating the dashboard with fake orders. Donations are intentionally
  // a logged-in-only action for this campus platform.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to make a donation." },
      { status: 401 }
    );
  }

  // Rate-limit by user.id (authenticated path only now).
  const rl = await rateLimit(request, "payments", { userId: user.id });
  if (!rl.allowed) return rl.response!;

  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return NextResponse.json(
      { error: "Razorpay is not configured on the server." },
      { status: 401 }
    );
  }

  let body: CreateOrderBody;
  try {
    body = (await request.json()) as CreateOrderBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const amount = Number(body.amount);
  // Only INR is supported. Reject any other currency string rather than
  // forwarding it to Razorpay where it would produce an opaque API error.
  const currency = "INR";
  const receipt =
    typeof body.receipt === "string" && body.receipt
      ? body.receipt.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || `findora_${Date.now()}`
      : `findora_${Date.now()}`;

  if (!Number.isFinite(amount) || !Number.isInteger(amount)) {
    return NextResponse.json({ error: "Amount must be an integer (paise)." }, { status: 400 });
  }
  if (amount < SUPPORT_MIN_AMOUNT_PAISE) {
    return NextResponse.json(
      { error: `Amount must be at least ${SUPPORT_MIN_AMOUNT_PAISE} paise.` },
      { status: 400 }
    );
  }
  if (amount > SUPPORT_MAX_AMOUNT_PAISE) {
    return NextResponse.json(
      { error: `Amount exceeds maximum of ${SUPPORT_MAX_AMOUNT_PAISE} paise.` },
      { status: 400 }
    );
  }

  // 10-second dedup: prevent duplicate Razorpay orders from double-tap or
  // rapid retries. Key is scoped to (user.id, amount) so a user who changes
  // the amount gets a fresh order but a pure duplicate click reuses the last.
  const dedupKey = `dedup:payment:order:u:${user.id}:${amount}`;
  const dedupHit = await checkDedup<{ order_id: string; amount: number; currency: string }>(
    dedupKey
  );
  if (dedupHit.isDuplicate) {
    // eslint-disable-next-line no-console
    console.info(
      JSON.stringify({
        ts: new Date().toISOString(),
        route: "payments/create-order",
        event: "duplicate_payment_order_blocked",
        user_id: user.id,
        amount,
        existing_order_id: dedupHit.value.order_id,
      })
    );
    return NextResponse.json(dedupHit.value);
  }

  try {
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt,
      notes: { source: "findora_support" },
    });

    const orderPayload = {
      order_id: order.id,
      amount: order.amount as number,
      currency: order.currency,
    };

    // Cache for 10 s so rapid retries reuse the same Razorpay order.
    await storeDedup(dedupKey, orderPayload, 10);

    return NextResponse.json(orderPayload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Razorpay order creation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
