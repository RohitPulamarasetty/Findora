import { NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import { createServiceRoleClient } from "@/utils/supabase/admin";

export const runtime = "nodejs";

// ── Types ─────────────────────────────────────────────────────────────────
interface VerifyBody {
  razorpay_order_id?: unknown;
  razorpay_payment_id?: unknown;
  razorpay_signature?: unknown;
}

interface PaymentRow {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  amount: number;
  currency: string;
  donor_name: string | null;
  donor_email: string | null;
  status: string;
}

// Minimal shape of the Razorpay payment object we read. The official
// `razorpay` SDK types `payments.fetch` as returning `void` in some
// versions, so we treat the return as `unknown` and narrow defensively.
interface RazorpayPayment {
  amount: number | string;
  currency: string;
  status: string;
  email?: string;
  notes?: Record<string, unknown>;
}

// Postgres error code for unique-constraint violation. Treated as a benign
// "already recorded" outcome (Razorpay sometimes fires the success handler
// twice on flaky networks or hard reloads).
const PG_UNIQUE_VIOLATION = "23505";

// ── Lightweight structured logger ─────────────────────────────────────────
// Logs land in Vercel's runtime log stream under the `[payments/verify]`
// prefix so they're trivially grep-able. JSON payload keeps the data
// queryable; no PII beyond the donor email (already needed to receipt them).
function log(event: string, data: Record<string, unknown> = {}) {
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      route: "payments/verify",
      event,
      ...data,
    })
  );
}
function logError(event: string, data: Record<string, unknown> = {}) {
  // eslint-disable-next-line no-console
  console.error(
    JSON.stringify({
      ts: new Date().toISOString(),
      route: "payments/verify",
      level: "error",
      event,
      ...data,
    })
  );
}

// Safely serialise an unknown error for logs.
function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }
  if (typeof err === "object" && err !== null) return { ...(err as object) };
  return { value: String(err) };
}

export async function POST(request: Request) {
  // ── 0. Env sanity ───────────────────────────────────────────────────────
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    logError("missing_razorpay_config", { hasKeyId: !!keyId, hasKeySecret: !!keySecret });
    return NextResponse.json(
      { error: "Razorpay is not configured on the server." },
      { status: 500 }
    );
  }

  // ── 1. Parse body ───────────────────────────────────────────────────────
  let body: VerifyBody;
  try {
    body = (await request.json()) as VerifyBody;
  } catch (err) {
    logError("invalid_json", serializeError(err));
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const orderId = typeof body.razorpay_order_id === "string" ? body.razorpay_order_id : "";
  const paymentId = typeof body.razorpay_payment_id === "string" ? body.razorpay_payment_id : "";
  const signature = typeof body.razorpay_signature === "string" ? body.razorpay_signature : "";

  if (!orderId || !paymentId || !signature) {
    logError("missing_fields", {
      hasOrderId: !!orderId,
      hasPaymentId: !!paymentId,
      hasSignature: !!signature,
    });
    return NextResponse.json(
      { error: "Missing razorpay_order_id, razorpay_payment_id, or razorpay_signature." },
      { status: 400 }
    );
  }

  log("received", { orderId, paymentId });

  // ── 2. Verify signature (HMAC-SHA256, timing-safe compare) ──────────────
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "utf8");
  const providedBuf = Buffer.from(signature, "utf8");
  const valid =
    expectedBuf.length === providedBuf.length && crypto.timingSafeEqual(expectedBuf, providedBuf);

  if (!valid) {
    logError("signature_mismatch", { orderId, paymentId });
    return NextResponse.json({ error: "Signature mismatch." }, { status: 400 });
  }

  log("signature_verified", { orderId, paymentId });

  // ── 3. Fetch payment details from Razorpay ──────────────────────────────
  let payment: RazorpayPayment;
  try {
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    payment = (await razorpay.payments.fetch(paymentId)) as unknown as RazorpayPayment;
  } catch (err) {
    logError("razorpay_fetch_failed", { paymentId, ...serializeError(err) });
    return NextResponse.json(
      { error: "Could not retrieve payment details from Razorpay." },
      { status: 502 }
    );
  }

  // ── 4. Normalise and validate the payload ───────────────────────────────
  const amount = typeof payment.amount === "number" ? payment.amount : Number(payment.amount);
  const currency =
    typeof payment.currency === "string" && payment.currency.length > 0 ? payment.currency : "INR";
  const status = typeof payment.status === "string" ? payment.status : "captured";
  const donorEmail = typeof payment.email === "string" ? payment.email : null;
  const donorName =
    payment.notes && typeof payment.notes.name === "string" ? (payment.notes.name as string) : null;

  if (!Number.isFinite(amount) || amount <= 0) {
    // Refuse to persist a zero-amount payment — the only way amount is bad
    // is a malformed Razorpay response, which we want to surface, not hide.
    logError("invalid_amount_from_razorpay", { paymentId, rawAmount: payment.amount });
    return NextResponse.json(
      { error: "Razorpay returned an invalid amount for this payment." },
      { status: 502 }
    );
  }

  // We only persist payments that Razorpay considers settled. `failed` and
  // pending statuses must never reach the table — those are surfaced to
  // operations via the Razorpay dashboard.
  if (status !== "captured" && status !== "authorized") {
    log("non_terminal_status_skipped", { paymentId, status });
    return NextResponse.json(
      { error: `Payment is not in a settled state (status=${status}).` },
      { status: 409 }
    );
  }

  // ── 5. Persist to Supabase via the SERVICE-ROLE client ──────────────────
  const insertPayload: PaymentRow = {
    razorpay_payment_id: paymentId,
    razorpay_order_id: orderId,
    amount: Math.round(amount), // paise — integer column
    currency,
    donor_name: donorName,
    donor_email: donorEmail,
    status,
  };

  log("insert_attempt", { payload: insertPayload });

  let supabase: ReturnType<typeof createServiceRoleClient>;
  try {
    supabase = createServiceRoleClient();
  } catch (err) {
    logError("service_role_client_init_failed", serializeError(err));
    return NextResponse.json(
      { error: "Payment recorded by Razorpay but server storage is unavailable." },
      { status: 500 }
    );
  }

  const { data, error } = await supabase.from("payments").insert(insertPayload).select().single();

  if (error) {
    // Idempotency: a duplicate insert (same razorpay_payment_id) is a
    // success outcome — the row is already there from an earlier call.
    if (error.code === PG_UNIQUE_VIOLATION) {
      log("insert_duplicate_treated_as_success", { paymentId, orderId });
      return NextResponse.json({
        verified: true,
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        already_recorded: true,
      });
    }

    // Any other DB error MUST be surfaced — both to ops (via logs) and to
    // the calling client (so the UI can decide to retry / show support).
    logError("insert_failed", {
      paymentId,
      orderId,
      payload: insertPayload,
      pgCode: error.code,
      pgMessage: error.message,
      pgDetails: error.details,
      pgHint: error.hint,
    });
    return NextResponse.json(
      {
        error: "Payment was verified but could not be recorded. Contact support.",
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
      },
      { status: 500 }
    );
  }

  log("insert_succeeded", { paymentId, orderId, rowId: data?.id });

  return NextResponse.json({
    verified: true,
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    payment_row_id: data?.id ?? null,
  });
}
