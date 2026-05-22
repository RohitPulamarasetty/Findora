import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { safeNextPath } from "@/lib/safe-redirect";

const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN ?? "ds.study.iitm.ac.in";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET(request: NextRequest) {
  // OAuth callback is unauthenticated — limit by IP only. Strict bucket.
  const rl = await rateLimit(request, "auth");
  if (!rl.allowed) {
    return NextResponse.redirect(`${APP_URL}/login?error=rate_limited`);
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  // Validate the return-to path against open-redirect attacks. Any non-
  // same-origin / suspicious value falls back to /home.
  const next = safeNextPath(searchParams.get("next"), "/home");

  if (!code) {
    return NextResponse.redirect(`${APP_URL}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("OAuth callback error:", error.message);
    return NextResponse.redirect(`${APP_URL}/login?error=auth_failed`);
  }

  // Validate email domain
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${APP_URL}/login?error=no_email`);
  }

  const normalizedEmail = user.email.trim().toLowerCase();

  if (!normalizedEmail.endsWith(`@${ALLOWED_DOMAIN.toLowerCase()}`)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${APP_URL}/login?error=domain_not_allowed`);
  }

  // Banned-email check via service-role (banned_emails has deny-all policies
  // for client roles). Runs BEFORE we look at public.users so that a banned
  // user whose profile row was purged still cannot re-enter.
  try {
    const admin = createServiceRoleClient();
    const { data: banned } = await admin
      .from("banned_emails")
      .select("email")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (banned) {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${APP_URL}/login?error=account_banned`);
    }
  } catch (e) {
    console.error("banned_emails lookup failed:", e instanceof Error ? e.message : e);
    // Fail closed: if we can't verify, treat as unsafe.
    await supabase.auth.signOut();
    return NextResponse.redirect(`${APP_URL}/login?error=auth_failed`);
  }

  // Check if the active profile row is flagged banned (covers bans applied
  // after signup without the row being deleted).
  const { data: profile } = await supabase
    .from("users")
    .select("is_banned")
    .eq("id", user.id)
    .single();

  if (profile?.is_banned) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${APP_URL}/login?error=account_banned`);
  }

  return NextResponse.redirect(`${APP_URL}${next}`);
}
