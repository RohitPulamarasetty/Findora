import type { Metadata } from "next";
import { AppLayout } from "@/components/layout/app-layout";
import { AppTheme } from "@/components/shared/app-theme";
import { RealtimeShell } from "@/components/layout/realtime-shell";
import { createClient } from "@/utils/supabase/server";

// Authenticated app surfaces must NEVER be indexed — they expose campus-internal
// content. Children pages may still override individual fields via their own
// generateMetadata, but the robots block here propagates by default.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-snippet": -1,
      "max-image-preview": "none",
      "max-video-preview": -1,
    },
  },
};

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  let userProfile: { full_name: string; avatar_url: string | null } | undefined;

  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("role, full_name, avatar_url")
      .eq("id", user.id)
      .single();
    isAdmin = profile?.role === "admin";
    if (profile) {
      userProfile = { full_name: profile.full_name, avatar_url: profile.avatar_url };
    }
  }

  return (
    <AppTheme>
      {user && <RealtimeShell userId={user.id} />}
      <AppLayout isAdmin={isAdmin} user={userProfile}>
        {children}
      </AppLayout>
    </AppTheme>
  );
}
