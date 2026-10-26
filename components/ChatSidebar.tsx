import Link from "next/link";
import { sql } from "@/lib/db";

export default async function ChatSidebar({ businessId, activeId }: { businessId: string; activeId?: string }) {
  const convs = await sql`SELECT id, title FROM conversations WHERE business_id = ${businessId} ORDER BY updated_at DESC LIMIT 30`;
  return (
    <aside className="no-print md:border-r md:border-[var(--line)] md:pr-4">
      <Link href="/chat" className="btn w-full">+ New chat</Link>
      <h2 className="eyebrow mt-5">History</h2>
      {convs.length === 0 ? <p className="mt-2 text-sm text-[var(--muted)]">Nothing yet.</p> : (
        <ul className="mt-2 max-h-48 overflow-y-auto md:max-h-none">
          {convs.map((c) => (
            <li key={c.id}>
              <Link href={`/chat/${c.id}`} aria-current={c.id === activeId ? "page" : undefined}
                className={`block truncate border-l-2 px-2 py-2 text-sm ${c.id === activeId ? "border-[var(--ink)] font-semibold" : "border-transparent hover:border-[var(--line)]"}`}>
                {c.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
