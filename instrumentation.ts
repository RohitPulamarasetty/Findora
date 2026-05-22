/**
 * Next.js instrumentation hook. Runs once per server process at boot,
 * before any request is served. Two purposes:
 *
 *   1. Validate env vars — fail fast on bad config.
 *   2. Bootstrap Sentry IF `@sentry/nextjs` is installed AND SENTRY_DSN
 *      is set. Otherwise no-op; the rest of the app continues to work
 *      with the structured logger fallback in src/lib/logger.ts.
 *
 * Enabled via experimental.instrumentationHook in next.config.mjs.
 */
export async function register() {
  // ── 1. Env validation (always) ─────────────────────────────────────────
  try {
    const { validateEnv } = await import("./src/lib/env");
    validateEnv();
  } catch (err) {
    // Re-throw — a misconfigured deploy should not start serving traffic.
    throw err;
  }

  // ── 2. Optional Sentry bootstrap ───────────────────────────────────────
  if (!process.env.SENTRY_DSN) return;

  const dsn = process.env.SENTRY_DSN;
  const release = process.env.VERCEL_GIT_COMMIT_SHA;
  const environment = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";

  try {
    const dynamicImport = new Function("m", "return import(m)") as (m: string) => Promise<unknown>;
    const Sentry = (await dynamicImport("@sentry/nextjs")) as {
      init: (opts: Record<string, unknown>) => void;
    };

    if (process.env.NEXT_RUNTIME === "nodejs") {
      Sentry.init({
        dsn,
        environment,
        release,
        tracesSampleRate: environment === "production" ? 0.1 : 0,
        // Server-side: never auto-capture request bodies.
        sendDefaultPii: false,
      });
    } else if (process.env.NEXT_RUNTIME === "edge") {
      Sentry.init({
        dsn,
        environment,
        release,
        tracesSampleRate: 0,
        sendDefaultPii: false,
      });
    }
  } catch {
    // @sentry/nextjs not installed yet — degrade silently. Structured
    // logger is still in effect.
  }
}
