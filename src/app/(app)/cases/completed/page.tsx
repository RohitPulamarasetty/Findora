import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2, Trophy, Sparkles } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { ItemCard } from "@/components/features/items/item-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageTransition } from "@/components/shared/page-transition";
import type { ItemWithUser } from "@/types/items";

export const metadata: Metadata = { title: "Recovered Items" };

export default async function CompletedCasesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/cases/completed");

  const { data: items } = await supabase
    .from("items")
    .select(
      `*, user:users(id, full_name, avatar_url), images:item_images(id, url, storage_path, created_at)`
    )
    .eq("user_id", user.id)
    .in("status", ["completed", "resolved", "closed"])
    .order("created_at", { ascending: false });

  const completed = (items ?? []) as unknown as ItemWithUser[];

  return (
    <main className="page-safe-bottom">
      <PageHeader title="Recovered Items" back="/home" />
      <PageTransition>
        <div className="space-y-5 px-4 py-5">
          {completed.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 size={32} className="text-text-muted-fg" aria-hidden="true" />}
              title="No recovered items yet"
              description="Items you've reported that get successfully recovered will appear here."
            />
          ) : (
            <>
              {/* Summary banner */}
              <div className="via-teal-500/3 relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent p-4">
                <div className="pointer-events-none absolute right-4 top-3 opacity-10">
                  <Sparkles size={40} className="text-emerald-500" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 shadow-sm">
                    <Trophy size={20} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-base">
                      {completed.length} item{completed.length !== 1 ? "s" : ""} recovered
                    </p>
                    <p className="text-xs text-text-muted-fg">
                      Successfully reunited with their owners
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {completed.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            </>
          )}
        </div>
      </PageTransition>
    </main>
  );
}
