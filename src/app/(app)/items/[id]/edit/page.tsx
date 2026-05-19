import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EditItemForm } from "./edit-item-form";

export const metadata: Metadata = {
  title: "Edit Report",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditItemPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: item },
    {
      data: { user },
    },
  ] = await Promise.all([
    supabase.from("items").select("*").eq("id", id).single(),
    supabase.auth.getUser(),
  ]);

  if (!item) notFound();
  if (!user || user.id !== item.user_id) redirect(`/items/${id}`);

  return (
    <main className="page-safe-bottom">
      <PageHeader title="Edit Report" back={`/items/${id}`} />
      <div className="px-4 py-6">
        <EditItemForm item={item} />
      </div>
    </main>
  );
}
