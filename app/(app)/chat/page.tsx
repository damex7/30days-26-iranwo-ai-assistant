import { requireBusiness } from "@/lib/auth";
import ChatSidebar from "@/components/ChatSidebar";
import ChatBox from "@/components/ChatBox";

export const metadata = { title: "Chat" };

export default async function NewChat() {
  const { business } = await requireBusiness();
  return (
    <div className="grid gap-6 md:grid-cols-[220px_1fr]">
      <ChatSidebar businessId={business.id} />
      <section>
        <h1 className="sr-only">New chat</h1>
        <ChatBox conversationId={null} initial={[]} />
      </section>
    </div>
  );
}
