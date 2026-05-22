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
  // Authenticated users: rate-limit by user.id so the 6-req/min bucket is
  // per-account and shared users behind CGNAT don't starve each other.
  // Guest users: fall back to IP-keyed rate-limiting — still strict (6/min
  // per IP) to prevent Razorpay API-quota exhaustion via rotating IPs.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rl = await rateLimit(request, "payments", { userId: user?.id ?? null });
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
  const currency = typeof body.currency === "string" && body.currency ? body.currency : "INR";
  const receipt =
    typeof body.receipt === "string" && body.receipt
      ? body.receipt.slice(0, 40)
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
  // rapid retries. Key is scoped to (user/IP, amount) so a user who changes
  // the amount gets a fresh order but a pure duplicate click reuses the last.
  const identifier = user ? `u:${user.id}` : "guest";
  const dedupKey = `dedup:payment:order:${identifier}:${amount}`;
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
        identifier,
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
