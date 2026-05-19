import { NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import { createAdminClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

interface VerifyBody {
  razorpay_order_id?: unknown;
  razorpay_payment_id?: unknown;
  razorpay_signature?: unknown;
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

  // Persist the successful payment. Anything beyond this point is best-effort
  // bookkeeping — the response still reports success so the user gets their
  // confirmation. We never write payment rows for unverified payments.
  try {
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const payment = await razorpay.payments.fetch(paymentId);

    const amount =
      typeof payment.amount === "number"
        ? payment.amount
        : Number(payment.amount as unknown as string);
    const currency = typeof payment.currency === "string" ? payment.currency : "INR";
    const status = typeof payment.status === "string" ? payment.status : "captured";
    const donorEmail = typeof payment.email === "string" ? payment.email : null;
    const donorName =
      payment.notes && typeof (payment.notes as Record<string, unknown>).name === "string"
        ? ((payment.notes as Record<string, unknown>).name as string)
        : null;

    if (status === "captured" || status === "authorized") {
      const supabase = await createAdminClient();
      await supabase.from("payments").insert({
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        amount: Number.isFinite(amount) ? amount : 0,
        currency,
        donor_name: donorName,
        donor_email: donorEmail,
        status,
      });
    }
  } catch {
    // Swallow — the user has already paid and we've verified the signature.
    // Operations team can reconcile from the Razorpay dashboard if needed.
  }

  return NextResponse.json({
    verified: true,
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
  });
}
