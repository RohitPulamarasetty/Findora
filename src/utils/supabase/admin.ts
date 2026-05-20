import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Stateless service-role Supabase client.
 *
 * Use this for trusted server-only writes where you need to bypass RLS:
 *   - /api/payments/verify (inserting verified payments)
 *   - Any future webhook/worker that records signed events
 *
 * Why this is separate from `createAdminClient()` in ./server.ts:
 *
 *   `createAdminClient()` is built on `@supabase/ssr`'s `createServerClient`,
 *   which is cookie-aware. It is designed for SSR pages where the same
 *   request may also carry an end-user session cookie. When you mix that
 *   with the service-role key, in some Edge/Node runtime configurations
 *   the cookie-bound auth context wins over the bearer key, and your
 *   write attempts get evaluated under the user's RLS — typically
 *   resulting in silent insert failure for tables that deny `authenticated`.
 *
 *   `createClient` from `@supabase/supabase-js` is the canonical service-
 *   role primitive: no cookies, no session persistence, no auto-refresh.
 *   The Authorization header is the only auth signal, so RLS is reliably
 *   bypassed and inserts succeed.
 *
 * NEVER expose this client (or the service-role key) to the browser.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("Supabase service-role client: NEXT_PUBLIC_SUPABASE_URL is not set");
  }
  if (!serviceRoleKey) {
    throw new Error("Supabase service-role client: SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        "X-Client-Info": "findora-service-role",
      },
    },
  });
}
