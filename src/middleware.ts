import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const supabase = createClient(request, response);

  // Refresh session (keeps cookie up-to-date)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isAppRoute =
    pathname.startsWith("/home") ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/report") ||
    pathname.startsWith("/items") ||
    pathname.startsWith("/messages") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/cases") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/admin");

  // Redirect unauthenticated users trying to access app routes
  if (isAppRoute && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login
  if (pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // For all authenticated app routes: check ban status
  if (isAppRoute && user) {
    const { data: profile } = await supabase
      .from("users")
      .select("role, is_banned")
      .eq("id", user.id)
      .single();

    if (!profile || profile.is_banned) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/login?error=account_banned", request.url));
    }

    // Admin-only routes
    if (pathname.startsWith("/admin") && profile.role !== "admin") {
      return NextResponse.redirect(new URL("/home", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Skip the auth middleware for static assets and icon/manifest requests so
    // they're served cleanly by the CDN without any server logic running.
    // Includes: Next.js statics, favicon family, manifest, and our public dirs.
    "/((?!_next/static|_next/image|favicon\\.ico|favicon\\.svg|favicon-96x96\\.png|apple-touch-icon\\.png|web-app-manifest-192x192\\.png|web-app-manifest-512x512\\.png|site\\.webmanifest|og_img\\.png|robots\\.txt|sitemap\\.xml|icons|images).*)",
  ],
};
