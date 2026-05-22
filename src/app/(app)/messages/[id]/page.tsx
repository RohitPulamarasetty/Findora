import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ConversationView } from "./conversation-view";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { title: "Messages" };

  const { data: convo } = await supabase
    .from("conversations")
    .select("owner_id, finder_id")
    .eq("id", id)
    .single();
  if (!convo) return { title: "Messages" };

  const otherId = convo.owner_id === user.id ? convo.finder_id : convo.owner_id;
  const { data: other } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", otherId)
    .single();

  return { title: other?.full_name ?? "Conversation" };
}

export default async function ConversationPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/messages/${id}`);

  const { data: convo } = await supabase.from("conversations").select("*").eq("id", id).single();

  if (!convo) notFound();
  if (convo.owner_id !== user.id && convo.finder_id !== user.id) notFound();

  const otherId = convo.owner_id === user.id ? convo.finder_id : convo.owner_id;
  const [{ data: otherUser }, { data: item }] = await Promise.all([
    // `recoveries_count` powers the TrustBadge in the conversation header.
    supabase
      .from("users")
      .select("id, full_name, avatar_url, recoveries_count")
      .eq("id", otherId)
      .single(),
    // Include status so the chat view can show/hide the resolve action.
    supabase.from("items").select("id, title, type, status").eq("id", convo.item_id).single(),
  ]);

  // The conversation's owner_id equals the item reporter's user_id.
  const isItemOwner = convo.owner_id === user.id;

  return (
    <ConversationView
      conversationId={id}
      currentUserId={user.id}
      isItemOwner={isItemOwner}
      conversation={{
        other_user: otherUser ?? null,
        item: item ?? null,
        is_locked: convo.is_locked,
      }}
    />
  );
}
