import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsClient } from "./settings-client";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/settings");

  const { data: profile } = await supabase
    .from("users")
    .select("id, full_name, email, avatar_url, created_at, role")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  return (
    <main className="page-safe-bottom">
      <PageHeader title="Settings" />
      <SettingsClient profile={profile} />
    </main>
  );
}
