import { AppTheme } from "@/components/shared/app-theme";
import { ForceDarkTheme } from "@/components/shared/force-dark-theme";
import { createClient } from "@/utils/supabase/server";

/**
 * /about lives outside the (public) and (app) route groups precisely because
 * its theme depends on auth state:
 *
 *   - Logged-out visitors get the cinematic forced-dark marketing experience,
 *     identical to /, /privacy, /terms, /contact (which still live under
 *     (public)).
 *   - Logged-in users get the AppTheme provider — same one mounted by the
 *     (app) layout — so the page inherits their saved light / dark / system
 *     preference.
 *
 * This avoids nested ThemeProvider conflicts: only one provider is ever
 * rendered per request. The branch happens server-side, so the HTML that
 * lands in the browser already contains the correct provider's inline script
 * (next-themes injects its pre-paint class-sync script as part of the
 * provider's first render). That keeps flash-of-incorrect-theme out of the
 * picture and preserves SSR correctness.
 *
 * The page intentionally does NOT use the (app) shell (sidebar / bottom nav)
 * — it keeps its own marketing chrome so the experience matches what
 * logged-out visitors see when they're sent the same link.
 */
export default async function AboutLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return <AppTheme>{children}</AppTheme>;
  }
  return <ForceDarkTheme>{children}</ForceDarkTheme>;
}
