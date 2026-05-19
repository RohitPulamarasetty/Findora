"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Lock } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { MessageList } from "@/components/features/messages/message-list";
import { ChatInput } from "@/components/features/messages/chat-input";
import { TypingIndicator } from "@/components/features/messages/typing-indicator";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/hooks/use-messages";
import { useSendMessage } from "@/hooks/use-send-message";
import { queryKeys } from "@/lib/query-keys";
import type { ConversationWithPreview } from "@/types/conversations";

interface ConversationViewProps {
  conversationId: string;
  currentUserId: string;
  isItemOwner: boolean;
  conversation: {
    other_user: ConversationWithPreview["other_user"];
    item: { id: string; title: string; type: string; status: string } | null;
    is_locked: boolean;
  };
}

export function ConversationView({
  conversationId,
  currentUserId,
  isItemOwner,
  conversation,
}: ConversationViewProps) {
  const { data: messages, isLoading } = useMessages(conversationId);
  const { mutate: sendMessage, isPending } = useSendMessage(conversationId, currentUserId);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  // Track locked state locally so the UI updates immediately after resolving,
  // without requiring a full server round-trip / router refresh.
  const [localIsLocked, setLocalIsLocked] = useState(conversation.is_locked);

  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typingChannelRef = useRef<any>(null);

  // Scroll refs
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFirstScrollRef = useRef(true);
  const isPinnedRef = useRef(true);
  const userJustSentRef = useRef(false);

  // Derived state
  const { other_user, item, is_locked } = conversation;
  const isLost = item?.type === "lost";
  // "Resolved" means the item itself is closed — either from the server or this session.
  const isItemResolved = localIsLocked || item?.status === "completed" || item?.status === "closed";
  // "Locked" without being fully resolved means an admin/system locked the conversation
  // (e.g. pending review) without yet marking the item complete.
  const isAdminLocked = is_locked && !isItemResolved;
  const inputDisabled = is_locked || localIsLocked;
  // Show the resolve button only to the owner while the case is truly open.
  const canResolve = isItemOwner && !isItemResolved && !is_locked;
  const resolveLabel = isLost ? "Mark as Recovered" : "Mark as Handed Over";

  // ── Resolve mutation ────────────────────────────────────────────
  const queryClient = useQueryClient();
  const { mutate: resolveItem, isPending: isResolving } = useMutation({
    mutationFn: async () => {
      if (!item) throw new Error("Item not found");
      const res = await fetch(`/api/items/${item.id}/complete`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to resolve");
      }
      return res.json();
    },
    onSuccess: () => {
      setLocalIsLocked(true);
      toast.success("Case resolved — the item is now marked as recovered.");
      // Refresh all affected caches.
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations.lists() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.items.lists() });
      if (item) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.items.detail(item.id) });
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ── Scroll helpers ──────────────────────────────────────────────
  const handleScroll = useCallback(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    isPinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (!messages?.length) return;
    if (isFirstScrollRef.current) {
      isFirstScrollRef.current = false;
      scrollToBottom("instant");
      return;
    }
    if (isPinnedRef.current || userJustSentRef.current) {
      userJustSentRef.current = false;
      scrollToBottom("smooth");
    }
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!isOtherTyping || !isPinnedRef.current) return;
    scrollToBottom("smooth");
  }, [isOtherTyping, scrollToBottom]);

  // ── Mark as read on mount ───────────────────────────────────────
  useEffect(() => {
    void fetch(`/api/conversations/${conversationId}`, { method: "PATCH" });
  }, [conversationId]);

  // ── Typing indicator via Supabase Broadcast ─────────────────────
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on("broadcast", { event: "typing" }, ({ payload }: { payload: { user_id: string } }) => {
        if (payload.user_id === currentUserId) return;
        setIsOtherTyping(true);
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setIsOtherTyping(false), 3000);
      })
      .subscribe();

    typingChannelRef.current = channel;

    return () => {
      void supabase.removeChannel(channel);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, [conversationId, currentUserId]);

  const handleTyping = useCallback(() => {
    const channel = typingChannelRef.current;
    if (!channel) return;
    void channel.send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: currentUserId },
    });
  }, [currentUserId]);

  const handleSend = useCallback(
    (content: string) => {
      userJustSentRef.current = true;
      sendMessage(content);
    },
    [sendMessage]
  );

  return (
    <div className="fixed inset-0 z-[45] flex flex-col overflow-hidden bg-bg-base md:static md:inset-auto md:z-auto md:h-screen">
      {/* ── Sticky Header ───────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border-default bg-bg-base/95 px-4 py-3 backdrop-blur-xl">
        <Link
          href="/messages"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-muted-fg transition-colors hover:bg-bg-subtle hover:text-text-base"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </Link>

        <UserAvatar user={other_user ?? { full_name: "Unknown", avatar_url: null }} size="sm" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold text-text-base">
            {other_user?.full_name ?? "Unknown User"}
          </p>
          {item && (
            <Link
              href={`/items/${item.id}`}
              className="truncate text-[11px] font-medium leading-tight text-brand-500 hover:underline dark:text-brand-400"
            >
              {item.title}
            </Link>
          )}
        </div>

        {/* Resolve action — visible to item owner while case is open */}
        {canResolve && (
          <Button
            size="sm"
            onClick={() => setResolveOpen(true)}
            className="shrink-0 gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm shadow-emerald-500/20 hover:bg-emerald-400"
          >
            <CheckCircle2 size={12} />
            Resolve
          </Button>
        )}

        {/* Resolved badge — item is fully closed */}
        {isItemResolved && (
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400">
            <CheckCircle2 size={11} />
            <span>Resolved</span>
          </div>
        )}

        {/* Locked badge — admin/system lock, item not yet marked complete */}
        {isAdminLocked && (
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-bg-muted-surface px-2.5 py-1 text-xs font-medium text-text-muted-fg ring-1 ring-border-default">
            <Lock size={11} />
            <span>Locked</span>
          </div>
        )}
      </div>

      {/* ── Scrollable Messages Area ────────────────────────────────── */}
      <div ref={scrollAreaRef} onScroll={handleScroll} className="min-h-0 flex-1 overflow-y-auto">
        <MessageList
          messages={messages ?? []}
          currentUserId={currentUserId}
          isLoading={isLoading}
        />
        {isOtherTyping && <TypingIndicator />}
        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      {/* ── Sticky Input ────────────────────────────────────────────── */}
      <div className="shrink-0">
        <ChatInput
          onSend={handleSend}
          onTyping={handleTyping}
          disabled={inputDisabled}
          isPending={isPending}
        />
        <div
          className="md:hidden"
          style={{ height: "calc(5rem + env(safe-area-inset-bottom, 0px))" }}
          aria-hidden="true"
        />
      </div>

      {/* ── Resolve confirm dialog ───────────────────────────────────── */}
      <ConfirmDialog
        open={resolveOpen}
        onOpenChange={setResolveOpen}
        title={isLost ? "Mark item as recovered?" : "Mark as handed over?"}
        description={
          isLost
            ? "Confirm you've got your item back. This closes the case, locks all conversations, and removes the listing from the active feed."
            : "Confirm you've returned the item to its owner. This closes the case, locks all conversations, and removes the listing from the active feed."
        }
        confirmLabel={resolveLabel}
        isLoading={isResolving}
        onConfirm={() => {
          resolveItem();
          setResolveOpen(false);
        }}
      />
    </div>
  );
}
