import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

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
  const next = searchParams.get("next") ?? "/home";

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

  if (!user.email.endsWith(`@${ALLOWED_DOMAIN}`)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${APP_URL}/login?error=domain_not_allowed`);
  }

  // Check if user is banned
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
