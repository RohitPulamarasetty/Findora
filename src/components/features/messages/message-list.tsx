"use client";

import { Loader2 } from "lucide-react";
import { MessageBubble } from "./message-bubble";
import type { Message } from "@/types/conversations";

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  isLoading?: boolean;
}

export function MessageList({ messages, currentUserId, isLoading }: MessageListProps) {
  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <Loader2 size={24} className="animate-spin text-text-muted-fg" />
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
