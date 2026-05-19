import type { User } from "./users";

export type MessageStatus = "sent" | "delivered" | "read";

export interface Conversation {
  id: string;
  item_id: string;
  owner_id: string;
  finder_id: string;
  is_locked: boolean;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  content: string;
  status: MessageStatus;
  is_system: boolean;
  created_at: string;
}

export interface ConversationWithPreview extends Conversation {
  other_user: Pick<User, "id" | "full_name" | "avatar_url"> | null;
  item: { id: string; title: string; type: string } | null;
  last_message: Pick<Message, "content" | "created_at"> | null;
  unread_count: number;
}
