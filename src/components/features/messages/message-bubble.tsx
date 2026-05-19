"use client";

import { CheckCheck, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/conversations";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

function StatusIcon({ status }: { status: Message["status"] }) {
  if (status === "read") return <CheckCheck size={12} className="text-brand-200" />;
  if (status === "delivered") return <CheckCheck size={12} className="text-white/50" />;
  return <Check size={12} className="text-white/50" />;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const time = new Date(message.created_at).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  if (message.is_system) {
    return (
      <div className="flex justify-center py-4">
        <span className="rounded-full border border-border-default bg-bg-muted-surface px-4 py-1.5 text-[11px] font-medium italic text-text-muted-fg">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex px-3", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-[20px] px-4 py-3",
          isOwn
            ? "rounded-br-[6px] bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/25"
            : "rounded-bl-[6px] bg-bg-subtle text-text-base shadow-sm ring-1 ring-border-default"
        )}
      >
        <p className="whitespace-pre-wrap break-words text-[14px] leading-[1.5]">
          {message.content}
        </p>
        <div
          className={cn("mt-1.5 flex items-center gap-1", isOwn ? "justify-end" : "justify-start")}
        >
          <span
            className={cn(
              "text-[10px] tabular-nums",
              isOwn ? "text-white/55" : "text-text-muted-fg"
            )}
          >
            {time}
          </span>
          {isOwn && <StatusIcon status={message.status} />}
        </div>
      </div>
    </div>
  );
}
