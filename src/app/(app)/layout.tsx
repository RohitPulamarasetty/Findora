import { AppLayout } from "@/components/layout/app-layout";
import { createClient } from "@/utils/supabase/server";

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
    <AppLayout isAdmin={isAdmin} user={userProfile}>
      {children}
    </AppLayout>
  );
}
