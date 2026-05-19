"use client";

import { useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (content: string) => void;
  onTyping?: () => void;
  disabled?: boolean;
  isPending?: boolean;
}

export function ChatInput({ onSend, onTyping, disabled, isPending }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    autoResize();
    onTyping?.();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || disabled || isPending) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  const canSend = !!value.trim() && !disabled && !isPending;

  return (
    <div className="flex items-end gap-2.5 border-t border-border-default/60 bg-bg-base/90 px-4 py-3 backdrop-blur-xl">
      <div
        className={cn(
          "flex flex-1 items-end overflow-hidden rounded-2xl border bg-bg-subtle transition-all duration-200",
          disabled
            ? "border-border-default opacity-60"
            : "focus-within:ring-brand-500/12 border-border-default focus-within:border-brand-500/50 focus-within:ring-2"
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? "This conversation is locked" : "Message…"}
          rows={1}
          className="flex-1 resize-none bg-transparent px-4 py-3 text-[14px] leading-[1.5] text-text-base outline-none placeholder:text-text-muted-fg disabled:cursor-not-allowed"
        />
      </div>
      <button
        onClick={submit}
        disabled={!canSend}
        aria-label="Send message"
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all duration-200",
          canSend
            ? "bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/30 hover:from-brand-400 hover:to-brand-500 active:scale-95"
            : "bg-bg-muted-surface text-text-muted-fg"
        )}
      >
        <SendHorizontal size={18} />
      </button>
    </div>
  );
}
