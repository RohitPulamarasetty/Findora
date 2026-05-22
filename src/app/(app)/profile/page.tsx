import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ProfileView } from "./profile-view";
import type { ItemWithUser } from "@/types/items";
import type { ProfileUser } from "@/hooks/use-profile-user";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile");

  const [{ data: profile }, { data: items }] = await Promise.all([
    supabase
      .from("users")
      .select(
        "id, full_name, email, avatar_url, role, is_banned, recoveries_count, created_at, updated_at"
      )
      .eq("id", user.id)
      .single(),
    supabase
      .from("items")
      .select(
        // FK pinned because items has two refs to users (user_id + resolved_by).
        `*, user:users!items_user_id_fkey(id, full_name, avatar_url), images:item_images(id, url, storage_path, created_at)`
      )
      .eq("user_id", user.id)
      // Hide soft-removed items from the profile view.
      .neq("status", "removed")
      .order("created_at", { ascending: false }),
  ]);

  if (!profile) redirect("/login");

  return (
    <ProfileView
      userId={user.id}
      initialProfile={profile as ProfileUser}
      initialItems={(items ?? []) as unknown as ItemWithUser[]}
    />
  );
}
