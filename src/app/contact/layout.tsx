import { AppTheme } from "@/components/shared/app-theme";
import { ForceDarkTheme } from "@/components/shared/force-dark-theme";
import { createClient } from "@/utils/supabase/server";

/**
 * /contact lives outside the (public) and (app) route groups for the same
 * reason as /about — its theme must track auth state:
 *
 *   - Logged-out visitors get the forced-dark marketing experience, matching
 *     the landing page and other public surfaces.
 *   - Logged-in users get AppTheme so the page inherits their saved
 *     light / dark / system preference, matching the rest of the app.
 *
 * Only one ThemeProvider is ever mounted per request; the branch happens
 * server-side so the correct inline class-sync script ships in the initial
 * HTML, preventing any flash-of-incorrect-theme.
 */
export default async function ContactLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return <AppTheme>{children}</AppTheme>;
  }
  return <ForceDarkTheme>{children}</ForceDarkTheme>;
}
