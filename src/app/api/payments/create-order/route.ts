import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { SUPPORT_MIN_AMOUNT_PAISE, SUPPORT_MAX_AMOUNT_PAISE } from "@/lib/support";

export const runtime = "nodejs";

interface CreateOrderBody {
  amount?: unknown;
  currency?: unknown;
  receipt?: unknown;
}

export async function POST(request: Request) {
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

  try {
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt,
      notes: { source: "findora_support" },
    });

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Razorpay order creation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
