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

  // All service-role operations share one client instance.
  // eslint-disable-next-line prefer-const
  let admin!: ReturnType<typeof createServiceRoleClient>;
  try {
    admin = createServiceRoleClient();
  } catch (e) {
    console.error("[auth/callback] failed to create service-role client:", e instanceof Error ? e.message : e);
    await supabase.auth.signOut();
    return NextResponse.redirect(`${APP_URL}/login?error=auth_failed`);
  }

  // Banned-email check via service-role (banned_emails has deny-all policies
  // for client roles). Runs BEFORE we look at public.users so that a banned
  // user whose profile row was purged still cannot re-enter.
  try {
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
    console.error("[auth/callback] banned_emails lookup failed:", e instanceof Error ? e.message : e);
    // Fail closed: if we can't verify, treat as unsafe.
    await supabase.auth.signOut();
    return NextResponse.redirect(`${APP_URL}/login?error=auth_failed`);
  }

  // Belt-and-suspenders profile creation. The DB trigger (0020_user_profile_trigger)
  // handles normal sign-ups synchronously. This upsert covers edge cases:
  //   • trigger not yet applied to the project
  //   • trigger silently raised a warning and rolled back the insert
  //   • returning user whose profile row was purged by an admin
  // ignoreDuplicates: true → INSERT ... ON CONFLICT (id) DO NOTHING, so existing
  // profiles are never overwritten.
  const normalizedFullName =
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    (user.user_metadata?.name as string | undefined)?.trim() ||
    normalizedEmail.split("@")[0];

  const { error: upsertError } = await admin.from("users").upsert(
    {
      id: user.id,
      email: normalizedEmail,
      full_name: normalizedFullName,
      avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
      role: "student",
      is_banned: false,
    },
    { onConflict: "id", ignoreDuplicates: true }
  );

  if (upsertError) {
    console.error("[auth/callback] profile upsert failed", {
      userId: user.id,
      code: upsertError.code,
      message: upsertError.message,
    });
  } else {
    console.log("[auth/callback] profile ensured", { userId: user.id });
  }

  // Check if the active profile row is flagged banned (covers bans applied
  // after signup without the row being deleted).
  // maybeSingle() returns null (not an error) when no row exists — safe fallback.
  const { data: profile, error: profileFetchError } = await supabase
    .from("users")
    .select("is_banned")
    .eq("id", user.id)
    .maybeSingle();

  if (profileFetchError) {
    console.error("[auth/callback] profile fetch error", {
      userId: user.id,
      code: profileFetchError.code,
      message: profileFetchError.message,
    });
  }

  // Explicit check: only block when is_banned is literally true.
  if (profile?.is_banned === true) {
    console.warn("[auth/callback] blocked banned user", { userId: user.id });
    await supabase.auth.signOut();
    return NextResponse.redirect(`${APP_URL}/login?error=account_banned`);
  }

  console.log("[auth/callback] sign-in complete", { userId: user.id, next });
  return NextResponse.redirect(`${APP_URL}${next}`);
}
