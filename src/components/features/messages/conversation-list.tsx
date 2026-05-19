"use client";

import { MessageCircle } from "lucide-react";
import { ConversationRow } from "./conversation-row";
import { EmptyState } from "@/components/shared/empty-state";
import { useConversations } from "@/hooks/use-conversations";

function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border-default bg-bg-base p-3.5">
      <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-bg-subtle" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-32 animate-pulse rounded bg-bg-subtle" />
        <div className="h-3 w-48 animate-pulse rounded bg-bg-subtle" />
      </div>
    </div>
  );
}

export function ConversationList() {
  const { data: conversations, isLoading } = useConversations();

  if (isLoading) {
    return (
      <div className="space-y-2 px-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <ConversationSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!conversations?.length) {
    return (
      <EmptyState
        icon={<MessageCircle size={32} className="text-text-muted-fg" aria-hidden="true" />}
        title="No conversations yet"
        description="When you connect with someone about a lost or found item, your conversation will appear here."
      />
    );
  }

  return (
    <div className="space-y-2 px-4">
      {conversations.map((convo) => (
        <ConversationRow key={convo.id} conversation={convo} />
      ))}
    </div>
  );
}
