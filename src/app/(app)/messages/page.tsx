import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { ConversationList } from "@/components/features/messages/conversation-list";

export const metadata: Metadata = {
  title: "Messages",
};

export default function MessagesPage() {
  return (
    <main className="page-safe-bottom">
      <PageHeader title="Messages" />
      <div className="pt-4">
        <ConversationList />
      </div>
    </main>
  );
}
