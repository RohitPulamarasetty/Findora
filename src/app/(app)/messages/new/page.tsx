import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

interface PageProps {
  searchParams: Promise<{ itemId?: string; ownerId?: string }>;
}

export default async function NewConversationPage({ searchParams }: PageProps) {
  const { itemId, ownerId } = await searchParams;

  if (!itemId || !ownerId) redirect("/messages");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    redirect(
      `/login?next=${encodeURIComponent(`/messages/new?itemId=${itemId}&ownerId=${ownerId}`)}`
    );
  if (user.id === ownerId) redirect(`/items/${itemId}`);

  // Check if conversation already exists
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("item_id", itemId)
    .eq("finder_id", user.id)
    .single();

  if (existing) redirect(`/messages/${existing.id}`);

  // Verify item is still active
  const { data: item } = await supabase
    .from("items")
    .select("id, user_id, status")
    .eq("id", itemId)
    .single();

  if (!item || item.status !== "active" || item.user_id !== ownerId) {
    redirect(`/items/${itemId}`);
  }

  // Create conversation
  const { data: convo, error } = await supabase
    .from("conversations")
    .insert({ item_id: itemId, owner_id: ownerId, finder_id: user.id })
    .select("id")
    .single();

  if (error || !convo) redirect("/messages");

  redirect(`/messages/${convo.id}`);
}
