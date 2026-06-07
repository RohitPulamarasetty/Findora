import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/admin";
import { AdminConversationView } from "@/components/features/admin/admin-conversation-view";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Admin — Conversation" };

export default async function AdminConversationDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Auth: require logged-in admin. Middleware already enforces the admin
  // route guard at the edge, but we verify here for defense-in-depth.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") redirect("/home");

  // Use the service-role client to bypass RLS — admin must be able to read
  // any conversation regardless of whether they are a participant.
  const db = createServiceRoleClient();

  const { data: convo } = await db.from("conversations").select("*").eq("id", id).single();
  if (!convo) notFound();

  const [{ data: owner }, { data: finder }, { data: item }] = await Promise.all([
    db.from("users").select("id, full_name, avatar_url").eq("id", convo.owner_id).single(),
    db.from("users").select("id, full_name, avatar_url").eq("id", convo.finder_id).single(),
    db.from("items").select("id, title, type, status").eq("id", convo.item_id).single(),
  ]);

  return (
    <AdminConversationView
      conversationId={id}
      conversation={{
        owner: owner ?? null,
        finder: finder ?? null,
        item: item ?? null,
        is_locked: convo.is_locked,
      }}
    />
  );
}
