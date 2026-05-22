/**
 * Centralised structured logger.
 *
 * Output: single-line JSON to stdout/stderr — Vercel's log explorer picks it
 * up natively and any external shipper (Datadog/Logtail/etc.) can parse it.
 *
 * Sentry: the optional `@sentry/nextjs` dependency is loaded lazily IF
 *   1) the package is installed, AND
 *   2) SENTRY_DSN is set in env.
 * Otherwise `captureException` falls back to a structured stderr line and
 * the build/runtime do NOT require Sentry. This keeps the integration
 * incremental: install + set DSN whenever you're ready.
 *
 * PII policy: this module never serialises Supabase rows, request bodies,
 * cookies, or headers in full. Callers must pass only safe context
 * (route name, event, ids, error message/stack).
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  ts: string;
  level: LogLevel;
  event: string;
  [k: string]: unknown;
}

const NODE_ENV = process.env.NODE_ENV ?? "development";
const isProd = NODE_ENV === "production";

function emit(payload: LogPayload) {
  const line = safeStringify(payload);
  if (payload.level === "error" || payload.level === "warn") {
    // eslint-disable-next-line no-console
    console.error(line);
  } else {
    // eslint-disable-next-line no-console
    console.log(line);
  }
}

function safeStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return JSON.stringify({
      ts: new Date().toISOString(),
      level: "error",
      event: "log_serialize_failed",
    });
  }
}

function base(level: LogLevel, event: string, data: Record<string, unknown> = {}): LogPayload {
  return { ts: new Date().toISOString(), level, event, ...data };
}

export function logDebug(event: string, data?: Record<string, unknown>) {
  if (isProd) return; // skip debug noise in prod
  emit(base("debug", event, data));
}

export function logInfo(event: string, data?: Record<string, unknown>) {
  emit(base("info", event, data));
}

export function logWarn(event: string, data?: Record<string, unknown>) {
  emit(base("warn", event, data));
}

export function logError(event: string, data?: Record<string, unknown>) {
  emit(base("error", event, data));
}

/** Serialise an unknown error into a log-safe shape (name, message, stack). */
export function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      // Trim stacks in prod to keep log lines bounded.
      stack: isProd ? err.stack?.split("\n").slice(0, 6).join("\n") : err.stack,
    };
  }
  if (typeof err === "object" && err !== null) {
    try {
      return JSON.parse(JSON.stringify(err)) as Record<string, unknown>;
    } catch {
      return { value: String(err) };
    }
  }
  return { value: String(err) };
}

// ── Optional Sentry integration ──────────────────────────────────────────────
// `new Function("...")` hides the module specifier from the TypeScript
// resolver and the webpack/turbo bundler, so the import only happens at
// runtime IF the package is actually installed. Failing imports degrade
// silently to the structured log fallback.
type SentryLike = {
  captureException: (err: unknown, ctx?: { extra?: Record<string, unknown> }) => unknown;
  captureMessage?: (msg: string, ctx?: { extra?: Record<string, unknown> }) => unknown;
};

let sentryCache: SentryLike | null | undefined; // undefined = uninitialized
async function loadSentry(): Promise<SentryLike | null> {
  if (sentryCache !== undefined) return sentryCache;
  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) {
    sentryCache = null;
    return null;
  }
  try {
    const dynamicImport = new Function("m", "return import(m)") as (m: string) => Promise<unknown>;
    const mod = (await dynamicImport("@sentry/nextjs")) as SentryLike;
    sentryCache = mod;
    return mod;
  } catch {
    sentryCache = null;
    return null;
  }
}

/** Capture an exception. Sends to Sentry if available; always logs. */
export function captureException(err: unknown, context?: Record<string, unknown>): void {
  logError(context?.event ? String(context.event) : "exception", {
    ...context,
    error: serializeError(err),
  });
  // Fire-and-forget — never block the request on telemetry.
  loadSentry()
    .then((s) => s?.captureException(err, { extra: context }))
    .catch(() => {
      /* telemetry is best-effort */
    });
}

/** Capture a notable message (non-fatal). */
export function captureMessage(msg: string, context?: Record<string, unknown>): void {
  logWarn(msg, context);
  loadSentry()
    .then((s) => s?.captureMessage?.(msg, { extra: context }))
    .catch(() => {
      /* best effort */
    });
}
