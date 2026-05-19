import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

interface VerifyBody {
  razorpay_order_id?: unknown;
  razorpay_payment_id?: unknown;
  razorpay_signature?: unknown;
}

export async function POST(request: Request) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json(
      { error: "Razorpay is not configured on the server." },
      { status: 401 }
    );
  }

  let body: VerifyBody;
  try {
    body = (await request.json()) as VerifyBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const orderId = typeof body.razorpay_order_id === "string" ? body.razorpay_order_id : "";
  const paymentId = typeof body.razorpay_payment_id === "string" ? body.razorpay_payment_id : "";
  const signature = typeof body.razorpay_signature === "string" ? body.razorpay_signature : "";

  if (!orderId || !paymentId || !signature) {
    return NextResponse.json(
      { error: "Missing razorpay_order_id, razorpay_payment_id, or razorpay_signature." },
      { status: 400 }
    );
  }

  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  // Constant-time compare to avoid timing-attack signature recovery
  const expectedBuf = Buffer.from(expected, "utf8");
  const providedBuf = Buffer.from(signature, "utf8");
  const valid =
    expectedBuf.length === providedBuf.length && crypto.timingSafeEqual(expectedBuf, providedBuf);

  if (!valid) {
    return NextResponse.json({ error: "Signature mismatch." }, { status: 400 });
  }

  return NextResponse.json({
    verified: true,
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
  });
}
