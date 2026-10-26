import { sql } from "@/lib/db";
import { formatDate } from "@/lib/time";

export default async function DraftHistory({ businessId, kind }: { businessId: string; kind: "reply" | "post" }) {
  const rows = await sql`SELECT id, input, created_at FROM drafts WHERE business_id = ${businessId} AND kind = ${kind}
                         ORDER BY created_at DESC LIMIT 8`;
  if (rows.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="eyebrow">Recent</h2>
      <ul className="mt-2">
        {rows.map((d) => (
          <li key={d.id} className="flex justify-between gap-4 border-b border-[var(--line)] py-2 text-sm">
            <span className="truncate">{d.input}</span><span className="shrink-0 text-[var(--muted)]">{formatDate(d.created_at)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
