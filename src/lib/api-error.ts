/**
 * Standard API error envelope.
 *
 * Use from route handlers to:
 *   1. Never leak raw DB messages to clients in production
 *   2. Send a consistent { error, code, requestId? } shape
 *   3. Log the original error with structured context
 *
 * Adoption is INCREMENTAL — existing routes keep working. New routes and
 * touched routes should switch to `apiError(...)` over time.
 *
 * Usage:
 *   if (!user) return apiError(401, "unauthorized");
 *   if (!parsed.success) return apiError(400, "invalid_input", parsed.error.issues[0]?.message);
 *   if (dbErr) return apiError(500, "db_error", dbErr.message, { dbErr, route: "items/POST" });
 */
import { NextResponse } from "next/server";
import { captureException, logError } from "./logger";

const isProd = process.env.NODE_ENV === "production";

export type ApiErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "invalid_input"
  | "rate_limited"
  | "conflict"
  | "upstream_error"
  | "db_error"
  | "internal_error";

const DEFAULT_MESSAGES: Record<ApiErrorCode, string> = {
  unauthorized: "Authentication required.",
  forbidden: "You do not have permission to perform this action.",
  not_found: "Resource not found.",
  invalid_input: "The request was invalid.",
  rate_limited: "Too many requests. Please slow down.",
  conflict: "This conflicts with existing data.",
  upstream_error: "An upstream service failed. Please try again.",
  db_error: "A database error occurred.",
  internal_error: "Something went wrong. Please try again.",
};

/**
 * Build a standardised error response. In production, the user-facing
 * message is the canned text for the code; the original message is
 * logged but NOT returned. In development the original message is
 * included to speed up debugging.
 */
export function apiError(
  status: number,
  code: ApiErrorCode,
  internalMessage?: string,
  logContext?: Record<string, unknown>
): NextResponse {
  const userMessage = !isProd && internalMessage ? internalMessage : DEFAULT_MESSAGES[code];

  if (status >= 500) {
    logError("api_error", { status, code, internalMessage, ...logContext });
    if (logContext?.error) captureException(logContext.error, { code, status });
  }

  return NextResponse.json(
    {
      error: userMessage,
      code,
    },
    { status }
  );
}
