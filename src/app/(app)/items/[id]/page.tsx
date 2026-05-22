import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { ItemDetail } from "@/components/features/items/item-detail";
import type { ItemWithUser } from "@/types/items";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("items").select("title").eq("id", id).single();
  return { title: data?.title ?? "Item Detail" };
}

export default async function ItemDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: item },
    {
      data: { user },
    },
  ] = await Promise.all([
    supabase
      .from("items")
      .select(
        // `recoveries_count` populates the reporter's TrustBadge (mig. 0015).
        // FK pinned because items has two refs to users (user_id + resolved_by).
        `*, user:users!items_user_id_fkey(id, full_name, avatar_url, recoveries_count), images:item_images(id, url, storage_path, created_at)`
      )
      .eq("id", id)
      .single(),
    supabase.auth.getUser(),
  ]);

  if (!item) notFound();

  let currentUser = null;
  if (user) {
    const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();
    currentUser = profile;
  }

  let existingConversationId: string | null = null;
  if (user && user.id !== item.user_id) {
    const { data: convo } = await supabase
      .from("conversations")
      .select("id")
      .eq("item_id", id)
      .eq("finder_id", user.id)
      .single();
    existingConversationId = convo?.id ?? null;
  }

  return (
    <main className="page-safe-bottom">
      <PageHeader title="Item Details" back="/home" sticky />
      <div className="px-4 py-5 md:px-6">
        <ItemDetail
          item={item as unknown as ItemWithUser}
          currentUser={currentUser}
          existingConversationId={existingConversationId}
        />
      </div>
    </main>
  );
}
