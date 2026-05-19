import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Lock } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Admin — Conversations" };

export default async function AdminConversationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: convos } = await supabase
    .from("conversations")
    .select("id, item_id, owner_id, finder_id, is_locked, last_message_at, created_at")
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(50);

  if (!convos?.length) {
    return (
      <main className="page-safe-bottom px-4 py-6">
        <h1 className="mb-4 text-lg font-bold text-text-base">Conversations</h1>
        <EmptyState
          icon={<MessageSquare size={32} className="text-text-muted-fg" aria-hidden="true" />}
          title="No conversations"
          description="No conversations exist yet."
        />
      </main>
    );
  }

  // Fetch participants and items
  const ownerIds = Array.from(new Set(convos.map((c) => c.owner_id)));
  const finderIds = Array.from(new Set(convos.map((c) => c.finder_id)));
  const allUserIds = Array.from(new Set([...ownerIds, ...finderIds]));
  const itemIds = Array.from(new Set(convos.map((c) => c.item_id)));

  const [{ data: users }, { data: items }] = await Promise.all([
    supabase.from("users").select("id, full_name").in("id", allUserIds),
    supabase.from("items").select("id, title").in("id", itemIds),
  ]);

  const userMap = new Map(users?.map((u) => [u.id, u]) ?? []);
  const itemMap = new Map(items?.map((i) => [i.id, i]) ?? []);

  return (
    <main className="page-safe-bottom px-4 py-6">
      <h1 className="mb-4 text-lg font-bold text-text-base">Conversations ({convos.length})</h1>
      <div className="space-y-2">
        {convos.map((c) => {
          const owner = userMap.get(c.owner_id);
          const finder = userMap.get(c.finder_id);
          const item = itemMap.get(c.item_id);
          return (
            <Link
              key={c.id}
              href={`/messages/${c.id}`}
              className="flex items-center gap-3 rounded-xl border border-border-default bg-bg-base p-3 transition-colors hover:bg-bg-subtle"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {c.is_locked && <Lock size={12} className="shrink-0 text-text-muted-fg" />}
                  <span className="truncate text-sm font-medium text-text-base">
                    {item?.title ?? "Unknown item"}
                  </span>
                </div>
                <p className="truncate text-xs text-text-muted-fg">
                  {owner?.full_name ?? "?"} ↔ {finder?.full_name ?? "?"}
                </p>
              </div>
              {c.last_message_at && (
                <span className="shrink-0 text-xs text-text-muted-fg">
                  {new Date(c.last_message_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </main>
  );
}
