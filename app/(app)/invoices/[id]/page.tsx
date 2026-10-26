import Link from "next/link";
import { notFound } from "next/navigation";
import { requireBusiness } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formatNaira, waNumber, type InvoiceItem } from "@/lib/money";
import { formatDate } from "@/lib/time";
import { setInvoiceStatus } from "@/app/actions";
import PrintButton from "@/components/PrintButton";

export default async function InvoicePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string }> }) {
  const { id } = await params;
  const { new: isNew } = await searchParams;
  const { business: b } = await requireBusiness();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const inv = (await sql`SELECT * FROM invoices WHERE id = ${id} AND business_id = ${b.id}`)[0];
  if (!inv) notFound();
  const items = inv.items as InvoiceItem[];
  const no = String(inv.number).padStart(4, "0");

  const message = [
    `Hello ${inv.customer_name}, here is your invoice from ${b.name} (#${no}):`,
    ...items.map((i) => `• ${i.quantity} × ${i.description}: ${formatNaira(i.quantity * i.unit_kobo)}`),
    Number(inv.delivery_kobo) ? `• Delivery: ${formatNaira(inv.delivery_kobo)}` : "",
    `Total: ${formatNaira(inv.total_kobo)}`,
    b.account_no ? `Pay to ${b.bank_name}, ${b.account_name}, ${b.account_no}` : "",
    "Thank you!",
  ].filter(Boolean).join("\n");
  const wa = `https://wa.me/${inv.customer_phone ? waNumber(inv.customer_phone) : ""}?text=${encodeURIComponent(message)}`;

  return (
    <div className="space-y-6">
      {isNew && <p role="status" className="ok no-print">Invoice drafted. Check every line before you send it: the AI read your notes, the app did the maths.</p>}

      <div className="no-print flex flex-wrap gap-2">
        <a href={wa} target="_blank" rel="noopener noreferrer" className="btn">Send on WhatsApp</a>
        {(inv.status === "draft" || inv.status === "sent") && <Link href={`/invoices/${id}/edit`} className="btn-ghost">Edit</Link>}
        <PrintButton />
      </div>

      <article className="card space-y-6 p-6 sm:p-10">
        <header className="flex flex-wrap justify-between gap-4 border-b-2 border-[var(--ink)] pb-4">
          <div>
            <p className="display text-3xl font-bold">{b.name}</p>
            <p className="text-sm text-[var(--muted)]">{b.city}, {b.state} · {b.whatsapp}</p>
          </div>
          <div className="text-right">
            <p className="eyebrow">Invoice</p>
            <p className="font-mono text-2xl">#{no}</p>
            <p className="text-sm">{formatDate(inv.created_at)}</p>
            <span className={`tag mt-1 inline-block ${inv.status === "paid" ? "tag-solid" : ""}`}>{inv.status}</span>
          </div>
        </header>
        <div>
          <p className="eyebrow">Billed to</p>
          <p className="font-semibold">{inv.customer_name}</p>
          {inv.customer_phone && <p className="text-sm">{inv.customer_phone}</p>}
        </div>
        <div className="overflow-x-auto">
          <table className="table min-w-[420px]">
            <thead><tr><th>Item</th><th className="text-right">Qty</th><th className="text-right">Price</th><th className="text-right">Amount</th></tr></thead>
            <tbody>
              {items.map((i, n) => (
                <tr key={n}>
                  <td>{i.description}</td>
                  <td className="text-right font-mono">{i.quantity}</td>
                  <td className="text-right font-mono">{formatNaira(i.unit_kobo)}</td>
                  <td className="text-right font-mono">{formatNaira(i.quantity * i.unit_kobo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl className="ml-auto max-w-xs space-y-1 font-mono">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatNaira(inv.subtotal_kobo)}</dd></div>
          <div className="flex justify-between"><dt>Delivery</dt><dd>{formatNaira(inv.delivery_kobo)}</dd></div>
          <div className="flex justify-between border-t-2 border-[var(--ink)] pt-2 text-xl font-bold"><dt>Total</dt><dd>{formatNaira(inv.total_kobo)}</dd></div>
        </dl>
        {(b.account_no || inv.notes) && (
          <footer className="border-t border-[var(--line)] pt-4 text-sm">
            {b.account_no && <p><span className="eyebrow">Pay to</span><br />{b.bank_name} · {b.account_name} · <span className="font-mono">{b.account_no}</span></p>}
            {inv.notes && <p className="mt-3">{inv.notes}</p>}
          </footer>
        )}
      </article>

      <section className="no-print">
        <h2 className="eyebrow">Mark as</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {(["draft", "sent", "paid", "cancelled"] as const).map((s) => (
            <form key={s} action={setInvoiceStatus}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="status" value={s} />
              <button className={s === inv.status ? "btn" : "btn-ghost"} aria-pressed={s === inv.status}>{s}</button>
            </form>
          ))}
        </div>
        {inv.source_text && <details className="mt-6 text-sm"><summary className="cursor-pointer">What you typed</summary><p className="mt-2 whitespace-pre-wrap text-[var(--muted)]">{inv.source_text}</p></details>}
      </section>
    </div>
  );
}
