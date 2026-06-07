"use client";

import Link from "next/link";
import { ArrowLeft, Lock, Shield } from "lucide-react";
import { useMessages } from "@/hooks/use-messages";
import { MessageList } from "@/components/features/messages/message-list";

interface Participant {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface AdminConversationViewProps {
  conversationId: string;
  conversation: {
    owner: Participant | null;
    finder: Participant | null;
    item: { id: string; title: string; type: string; status: string } | null;
    is_locked: boolean;
  };
}

export function AdminConversationView({
  conversationId,
  conversation,
}: AdminConversationViewProps) {
  const { data: messages, isLoading } = useMessages(conversationId);
  const { owner, finder, item, is_locked } = conversation;

  return (
    <div className="fixed inset-0 z-[45] flex flex-col overflow-hidden bg-bg-base md:static md:inset-auto md:z-auto md:h-screen">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border-default bg-bg-base/95 px-4 py-3 backdrop-blur-xl">
        <Link
          href="/admin/conversations"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-muted-fg transition-colors hover:bg-bg-subtle hover:text-text-base"
          aria-label="Back to conversations"
        >
          <ArrowLeft size={18} />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Shield size={12} className="shrink-0 text-brand-500" aria-hidden="true" />
            <p className="truncate text-[13px] font-bold text-text-base">
              {owner?.full_name ?? "?"} ↔ {finder?.full_name ?? "?"}
            </p>
          </div>
          {item && (
            <Link
              href={`/items/${item.id}`}
              className="truncate text-[11px] font-medium leading-tight text-brand-500 hover:underline dark:text-brand-400"
            >
              {item.title}
            </Link>
          )}
        </div>

        {is_locked && (
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-bg-muted-surface px-2.5 py-1 text-xs font-medium text-text-muted-fg ring-1 ring-border-default">
            <Lock size={11} />
            <span>Locked</span>
          </div>
        )}
      </div>

      {/* Messages — pass empty string so no bubble is styled as "own" (admin is an observer) */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <MessageList messages={messages ?? []} currentUserId="" isLoading={isLoading} />
      </div>

      {/* Read-only footer */}
      <div className="shrink-0 border-t border-border-default bg-bg-subtle px-4 py-3">
        <div className="flex items-center justify-center gap-1.5 text-xs text-text-muted-fg">
          <Shield size={12} aria-hidden="true" />
          <span>Admin view — read only</span>
        </div>
      </div>
    </div>
  );
}
