import { sql } from "@/lib/db";
import { getUser, type Business } from "@/lib/auth";
import { streamChat, type ChatTurn } from "@/lib/ai";
import { takeAiCredit, recordTokens } from "@/lib/usage";
import { ChatSchema } from "@/lib/validation";

export const maxDuration = 60; // seconds Vercel lets this function run while streaming

const json = (status: number, error: string) => Response.json({ error }, { status });

export async function POST(req: Request) {
  // 1. Who is asking? (A route handler can't redirect, so it answers 401.)
  const user = await getUser();
  if (!user) return json(401, "Please log in again");
  const bizRows = await sql`SELECT * FROM businesses WHERE owner_id = ${user.id}`;
  const business = bizRows[0] as Business | undefined;
  if (!business) return json(403, "Set up your business first");

  // 2. Is the input valid?
  const parsed = ChatSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json(400, parsed.error.issues[0]?.message ?? "Invalid message");
  const { message } = parsed.data;

  // 3. Do they own this conversation? Filtering by business_id means another owner's id simply "doesn't exist".
  let conversationId = parsed.data.conversationId;
  if (conversationId) {
    const owned = await sql`SELECT id FROM conversations WHERE id = ${conversationId} AND business_id = ${business.id}`;
    if (!owned[0]) return json(404, "Conversation not found");
  }

  // 4. Are they within today's limit? Checked before we spend money on the AI call.
  const credit = await takeAiCredit(user);
  if (!credit.ok) return json(429, `You've used all ${credit.limit} AI requests for today. It resets at midnight, Lagos time.`);

  if (!conversationId) {
    const title = message.length > 48 ? message.slice(0, 47) + "…" : message;
    const rows = await sql`INSERT INTO conversations (business_id, title) VALUES (${business.id}, ${title}) RETURNING id`;
    conversationId = rows[0].id as string;
  }
  await sql`INSERT INTO messages (conversation_id, role, content) VALUES (${conversationId}, 'user', ${message})`;

  const history = (await sql`
    SELECT role, content FROM messages WHERE conversation_id = ${conversationId} ORDER BY id DESC LIMIT 20`).reverse() as ChatTurn[];

  // 5. Stream the answer to the browser as plain text, piece by piece.
  const encoder = new TextEncoder();
  const convId = conversationId;
  const stream = new ReadableStream({
    async start(controller) {
      let full = "";
      let usage = { input: 0, output: 0 };
      try {
        const gen = streamChat(business, history);
        while (true) {
          const { value, done } = await gen.next();
          if (done) { usage = value; break; }
          full += value;
          controller.enqueue(encoder.encode(value));
        }
      } catch (e) {
        const note = "\n\n[The assistant stopped: " + (e instanceof Error ? e.message : "unknown error") + "]";
        full += note;
        controller.enqueue(encoder.encode(note));
      } finally {
        // Save whatever we got, even if the stream broke halfway.
        if (full.trim()) {
          await sql`INSERT INTO messages (conversation_id, role, content, input_tokens, output_tokens)
                    VALUES (${convId}, 'assistant', ${full}, ${usage.input}, ${usage.output})`;
        }
        await sql`UPDATE conversations SET updated_at = now() WHERE id = ${convId}`;
        await recordTokens(user.id, usage.input, usage.output);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Conversation-Id": convId },
  });
}
