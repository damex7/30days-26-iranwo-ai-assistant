import { notFound } from "next/navigation";
import { requireBusiness } from "@/lib/auth";
import { sql } from "@/lib/db";
import { deleteConversation } from "@/app/actions";
import ChatSidebar from "@/components/ChatSidebar";
import ChatBox from "@/components/ChatBox";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { business } = await requireBusiness();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  // Another owner's conversation id returns no row, so it 404s exactly like a made-up id.
  const conv = (await sql`SELECT id, title FROM conversations WHERE id = ${id} AND business_id = ${business.id}`)[0];
  if (!conv) notFound();
  const messages = await sql`SELECT role, content FROM messages WHERE conversation_id = ${id} ORDER BY id`;

  return (
    <div className="grid gap-6 md:grid-cols-[220px_1fr]">
      <ChatSidebar businessId={business.id} activeId={id} />
      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="truncate text-2xl font-bold">{conv.title}</h1>
          <form action={deleteConversation}>
            <input type="hidden" name="id" value={id} />
            <button className="text-sm underline">Delete</button>
          </form>
        </div>
        <ChatBox key={id} conversationId={id} initial={messages as { role: "user" | "assistant"; content: string }[]} />
      </section>
    </div>
  );
}
