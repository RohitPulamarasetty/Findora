/**
 * Runtime env validation. Called from instrumentation.ts at boot so a
 * mis-configured deploy throws at startup rather than mid-request.
 *
 * We only validate vars that are required for correctness. Optional vars
 * (Sentry DSN, search-console verification, Upstash) are not asserted —
 * the corresponding code paths fail-open with a logged warning.
 *
 * NOTE: this runs in BOTH the node and edge runtimes via instrumentation;
 * keep dependencies to standard library only.
 */
import { logError, logInfo, logWarn } from "./logger";

interface EnvRule {
  key: string;
  required: boolean;
  validate?: (value: string) => string | null; // return null if OK, or error msg
  publicSafe: boolean; // is it OK to be visible in the browser?
}

const RULES: EnvRule[] = [
  {
    key: "NEXT_PUBLIC_SUPABASE_URL",
    required: true,
    publicSafe: true,
    validate: (v) => (v.startsWith("https://") ? null : "must be an https URL"),
  },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: true, publicSafe: true },
  { key: "SUPABASE_SERVICE_ROLE_KEY", required: true, publicSafe: false },
  // ALLOWED_EMAIL_DOMAINS (preferred) or legacy ALLOWED_EMAIL_DOMAIN — both optional;
  // the auth callback defaults to all three IITM online-degree domains when unset.
  { key: "ALLOWED_EMAIL_DOMAINS", required: false, publicSafe: false },
  {
    key: "NEXT_PUBLIC_APP_URL",
    required: true,
    publicSafe: true,
    validate: (v) => (/^https?:\/\//.test(v) ? null : "must include http(s) scheme"),
  },
  { key: "NEXT_PUBLIC_RAZORPAY_KEY_ID", required: true, publicSafe: true },
  { key: "RAZORPAY_KEY_SECRET", required: true, publicSafe: false },
];

const OPTIONAL_BUT_RECOMMENDED: string[] = [
  "ALLOWED_EMAIL_DOMAINS",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "SENTRY_DSN",
  "CRON_SECRET",
];

export function validateEnv(): void {
  // Skip during `next build` static analysis where envs are placeholders;
  // the production runtime will re-run this. (Detected by NEXT_PHASE.)
  if (process.env.NEXT_PHASE === "phase-production-build") {
    logInfo("env_validate_skipped", { reason: "build_phase" });
    return;
  }

  const errors: string[] = [];

  for (const rule of RULES) {
    const v = process.env[rule.key];
    if (!v) {
      if (rule.required) errors.push(`Missing required env var: ${rule.key}`);
      continue;
    }
    if (rule.validate) {
      const err = rule.validate(v);
      if (err) errors.push(`${rule.key}: ${err}`);
    }
    // Sanity: never let a service-role key get exposed as NEXT_PUBLIC_*
    if (!rule.publicSafe && rule.key.startsWith("NEXT_PUBLIC_")) {
      errors.push(`${rule.key}: secret keys must not be NEXT_PUBLIC_*`);
    }
  }

  // Cross-checks
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  if (process.env.NODE_ENV === "production" && appUrl.includes("localhost")) {
    errors.push("NEXT_PUBLIC_APP_URL is localhost in production");
  }
  if (
    process.env.NODE_ENV === "production" &&
    (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "").startsWith("rzp_test_")
  ) {
    errors.push("NEXT_PUBLIC_RAZORPAY_KEY_ID is a TEST key in production");
  }

  for (const opt of OPTIONAL_BUT_RECOMMENDED) {
    if (!process.env[opt]) {
      logWarn("env_recommended_missing", { key: opt });
    }
  }

  if (errors.length > 0) {
    logError("env_validation_failed", { errors });
    // Throwing here aborts boot. Better to fail fast than serve bad config.
    throw new Error(`Env validation failed:\n  - ${errors.join("\n  - ")}`);
  }

  logInfo("env_validated", { count: RULES.length });
}
