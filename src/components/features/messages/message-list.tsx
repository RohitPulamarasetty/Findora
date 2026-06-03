"use client";

import { MessageBubble } from "./message-bubble";
import { MessageListSkeleton } from "@/components/shared/loading-skeletons/message-skeleton";
import type { Message } from "@/types/conversations";

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  isLoading?: boolean;
}

export function MessageList({ messages, currentUserId, isLoading }: MessageListProps) {
  if (isLoading) {
    return (
      <div className="min-h-full">
        <MessageListSkeleton />
      </div>
    );
  }

  if (!messages.length) {
    return (
      <div className="flex min-h-full items-center justify-center px-6 text-center">
        <p className="text-sm text-text-muted-fg">
          Say hello! This is the start of your conversation.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col justify-end px-4 pb-2 pt-4">
      <div className="space-y-0.5">
        {messages.map((msg, i) => {
          const prevSender = messages[i - 1]?.sender_id;
          const grouped = prevSender === msg.sender_id && !msg.is_system;
          return (
            <div key={msg.id} className={grouped ? "" : "mt-2"}>
              <MessageBubble message={msg} isOwn={msg.sender_id === currentUserId} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
