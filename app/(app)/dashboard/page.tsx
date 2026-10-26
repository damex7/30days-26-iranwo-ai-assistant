import Link from "next/link";
import { requireBusiness } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formatNaira } from "@/lib/money";
import { formatDate } from "@/lib/time";

export const metadata = { title: "Home" };

export default async function Dashboard() {
  const { user, business } = await requireBusiness();
  const [stats, invoices, chats] = await Promise.all([
    sql`SELECT
          COALESCE(SUM(total_kobo) FILTER (WHERE status = 'paid'), 0) AS paid,
          COALESCE(SUM(total_kobo) FILTER (WHERE status IN ('draft','sent')), 0) AS owed,
          COUNT(*) FILTER (WHERE status IN ('draft','sent')) AS open
        FROM invoices WHERE business_id = ${business.id}`,
    sql`SELECT id, number, customer_name, total_kobo, status, created_at FROM invoices
        WHERE business_id = ${business.id} ORDER BY created_at DESC LIMIT 5`,
    sql`SELECT id, title, updated_at FROM conversations WHERE business_id = ${business.id} ORDER BY updated_at DESC LIMIT 5`,
  ]);
  const s = stats[0];

  return (
    <div className="space-y-10">
      <section>
        <p className="eyebrow">Good to see you</p>
        <h1 className="mt-1 text-4xl font-bold">{user.name.split(" ")[0]}, what do you need?</h1>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Link href="/invoices/new" className="card block hover:bg-[var(--ink)] hover:text-[var(--paper)]">
            <p className="font-mono text-xs">01</p><p className="display mt-1 text-xl font-bold">Make an invoice</p>
          </Link>
          <Link href="/replies" className="card block hover:bg-[var(--ink)] hover:text-[var(--paper)]">
            <p className="font-mono text-xs">02</p><p className="display mt-1 text-xl font-bold">Reply a customer</p>
          </Link>
          <Link href="/posts" className="card block hover:bg-[var(--ink)] hover:text-[var(--paper)]">
            <p className="font-mono text-xs">03</p><p className="display mt-1 text-xl font-bold">Write a post</p>
          </Link>
        </div>
      </section>

      <section aria-label="Money" className="grid grid-cols-3 border-y-2 border-[var(--ink)]">
        {[["Paid", formatNaira(s.paid)], ["Still owed", formatNaira(s.owed)], ["Open invoices", String(s.open)]].map(([k, v], i) => (
          <div key={k} className={`py-4 ${i ? "border-l border-[var(--line)] pl-4" : ""}`}>
            <p className="eyebrow">{k}</p>
            <p className="display mt-1 text-2xl font-bold sm:text-3xl">{v}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-8 md:grid-cols-2">
        <section>
          <div className="flex items-baseline justify-between"><h2 className="text-2xl font-bold">Recent invoices</h2><Link className="text-sm underline" href="/invoices">All</Link></div>
          {invoices.length === 0 ? <p className="mt-3 text-[var(--muted)]">No invoices yet.</p> : (
            <ul className="mt-3">
              {invoices.map((i) => (
                <li key={i.id} className="border-b border-[var(--line)]">
                  <Link href={`/invoices/${i.id}`} className="flex justify-between gap-3 py-3">
                    <span>#{i.number} · {i.customer_name}<span className="block text-xs text-[var(--muted)]">{formatDate(i.created_at)}</span></span>
                    <span className="text-right">{formatNaira(i.total_kobo)}<span className={`tag ml-2 ${i.status === "paid" ? "tag-solid" : ""}`}>{i.status}</span></span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <div className="flex items-baseline justify-between"><h2 className="text-2xl font-bold">Recent chats</h2><Link className="text-sm underline" href="/chat">New chat</Link></div>
          {chats.length === 0 ? <p className="mt-3 text-[var(--muted)]">Ask the assistant anything about your business.</p> : (
            <ul className="mt-3">
              {chats.map((c) => (
                <li key={c.id} className="border-b border-[var(--line)]">
                  <Link href={`/chat/${c.id}`} className="block py-3">{c.title}<span className="block text-xs text-[var(--muted)]">{formatDate(c.updated_at)}</span></Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
