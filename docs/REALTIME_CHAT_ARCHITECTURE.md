# REALTIME_CHAT_ARCHITECTURE.md — Real-Time Messaging Architecture
# Findora: Campus Lost & Found Platform

**Version:** 1.0.0

---

## 1. Overview

Findora's messaging system is built on **Supabase Realtime**, which uses Postgres Change Data Capture (CDC) via logical replication to broadcast database changes to connected clients over WebSocket.

The result is a low-latency, secure, 1:1 messaging system where only authorized conversation participants receive message updates.

---

## 2. Architecture Diagram

```
Client A (Owner)               Supabase                    Client B (Finder)
     │                           │                                │
     │──── WebSocket connect ───►│                                │
     │  subscribe: conversation  │◄──── WebSocket connect ────────│
     │    channel `conv:{id}`    │   subscribe: `conv:{id}`       │
     │                           │                                │
     │── POST /api/messages ────►│                                │
     │   (REST insert to DB)     │                                │
     │                           │── WAL → Realtime broadcast ───►│
     │◄── optimistic UI update   │   `conv:{id}` channel          │
     │                           │                                │
     │                           │── Realtime broadcast ─────────►│
     │◄── confirmed message      │   message event                │
     │    (from subscription)    │                                │
```

---

## 3. Supabase Realtime Configuration

### Channel Setup (Client)

```typescript
// hooks/use-conversation.ts
import { useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export function useConversation(conversationId: string) {
  const supabase = createClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          handleNewMessage(payload.new as Message)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          handleMessageUpdate(payload.new as Message)
        }
      )
      .on('broadcast', { event: 'typing' }, (payload) => {
        handleTypingEvent(payload)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime connected to conversation:', conversationId)
        }
      })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])
}
```

### Typing Indicators (Broadcast — not persisted)

```typescript
// Send typing event (does NOT go through DB)
const sendTypingEvent = (isTyping: boolean) => {
  channelRef.current?.send({
    type: 'broadcast',
    event: 'typing',
    payload: {
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      is_typing: isTyping,
    },
  })
}
```

---

## 4. Message Flow

### 4.1 Sending a Message

```
1. User types message + clicks Send
2. Optimistic UI: message appears immediately in chat (pending state)
3. POST /api/conversations/{id}/messages → validates + inserts to DB
4. Supabase Realtime CDC detects INSERT on messages table
5. Broadcasts to all subscribers of `conversation:{id}` channel
6. Sender: optimistic message confirmed (replace pending with real)
7. Receiver: new message appears in real-time
```

### 4.2 Optimistic UI Pattern

```typescript
// In ConversationView component
const sendMessage = async (content: string) => {
  const tempId = `temp-${Date.now()}`

  // 1. Add optimistic message immediately
  setMessages(prev => [...prev, {
    id: tempId,
    content,
    sender_id: currentUser.id,
    status: 'sending',
    created_at: new Date().toISOString(),
    isPending: true,
  }])

  try {
    // 2. Persist to DB
    const result = await sendMessageMutation.mutateAsync({ content, conversationId })

    // 3. Replace optimistic with real message
    setMessages(prev =>
      prev.map(m => m.id === tempId ? { ...result, isPending: false } : m)
    )
  } catch (error) {
    // 4. Mark as failed
    setMessages(prev =>
      prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m)
    )
  }
}
```

### 4.3 Message Pagination (Older Messages)

```typescript
// Cursor-based pagination for older messages
const loadOlderMessages = async () => {
  const oldest = messages[0]
  const olderMessages = await fetchMessages({
    conversationId,
    before: oldest.created_at,
    limit: 50,
  })
  setMessages(prev => [...olderMessages, ...prev])
}
```

---

## 5. Read Receipts

### Architecture

- `messages.status`: `sent` → `delivered` → `read`
- `messages.read_at`: timestamp when receiver read the message

### Implementation

```typescript
// Mark messages as read when conversation is opened/focused
const markMessagesAsRead = async () => {
  const unreadIds = messages
    .filter(m => m.sender_id !== currentUser.id && m.status !== 'read')
    .map(m => m.id)

  if (unreadIds.length === 0) return

  await supabase
    .from('messages')
    .update({ status: 'read', read_at: new Date().toISOString() })
    .in('id', unreadIds)
}

// Trigger on: conversation open, window focus, new message received
useEffect(() => {
  markMessagesAsRead()
}, [conversationId, messages.length])
```

### Read Status UI

```
✓  = sent
✓✓ = delivered
✓✓ (blue) = read
```

---

## 6. Unread Message Count

### Per-conversation unread count

```typescript
// In conversations list query
const { data: conversations } = await supabase
  .from('conversations')
  .select(`
    *,
    messages!inner(
      id,
      status,
      sender_id
    )
  `)
  .or(`owner_id.eq.${userId},finder_id.eq.${userId}`)

// Compute unread count client-side
const withUnread = conversations.map(conv => ({
  ...conv,
  unread_count: conv.messages.filter(
    m => m.sender_id !== userId && m.status !== 'read'
  ).length
}))
```

### Realtime unread count update

```typescript
// Subscribe to conversation list changes (for unread badge)
supabase
  .channel('user-conversations')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
  }, () => {
    // Refetch conversations to update unread counts
    queryClient.invalidateQueries(['conversations'])
  })
  .subscribe()
```

---

## 7. Conversation Lock (Post-Completion)

When an item is marked as completed:

```typescript
// Server action / API route
await supabase
  .from('conversations')
  .update({ is_locked: true, locked_at: new Date().toISOString() })
  .eq('id', conversationId)

// System message inserted
await supabase
  .from('messages')
  .insert({
    conversation_id: conversationId,
    sender_id: currentUser.id,
    content: '✓ Item marked as received. This conversation is now closed.',
    is_system: true,
    status: 'read',
  })
```

**Client-side enforcement:**
```typescript
// ChatInput.tsx
if (conversation.is_locked) {
  return (
    <div className="chat-locked-notice">
      This case has been completed. Chat is now read-only.
    </div>
  )
}
```

**DB enforcement (RLS):**
```sql
-- messages INSERT policy checks conversation.is_locked = FALSE
-- Prevents API-level bypass as well
```

---

## 8. Reconnection Strategy

```typescript
// Supabase Realtime handles reconnection automatically
// Additional app-level handling:

const [isConnected, setIsConnected] = useState(true)

channel.subscribe((status) => {
  if (status === 'SUBSCRIBED') setIsConnected(true)
  if (status === 'CHANNEL_ERROR') setIsConnected(false)
  if (status === 'TIMED_OUT') {
    setIsConnected(false)
    // Fallback: poll for new messages every 5 seconds
    startPollingFallback()
  }
})

// Stop polling when reconnected
const stopPollingFallback = () => { ... }
```

---

## 9. Channel Authorization

Supabase Realtime respects RLS policies for `postgres_changes` subscriptions. Only users whose `auth.uid()` passes the `messages` SELECT policy will receive message events for a given conversation.

- RLS on `messages` ensures only `owner_id` and `finder_id` can select
- Realtime CDC broadcasts only to authorized subscribers
- Admin bypass: admins can subscribe to any channel via service role (admin dashboard only, server-side)

---

## 10. Performance Considerations

| Concern | Solution |
|---------|----------|
| WebSocket limits | Supabase manages pooling; one channel per conversation |
| Message history load | Paginated, cursor-based, 50 msgs/page |
| Typing debounce | 300ms debounce on typing events, 2s timeout to clear |
| Realtime event flood | Rate limit: 1 message per 500ms per user (API layer) |
| Reconnection | Exponential backoff by Supabase SDK; app-level polling fallback |
| Old message hydration | Fetched via REST on conversation open, Realtime only for new |

---

## 11. Message Data Model

```typescript
interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  status: 'sent' | 'delivered' | 'read'
  is_system: boolean
  read_at: string | null
  created_at: string
  sender: {
    full_name: string
    avatar_url: string
  }
  // Client-only
  isPending?: boolean
  isFailed?: boolean
}
```
