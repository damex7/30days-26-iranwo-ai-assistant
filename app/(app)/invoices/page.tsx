import Link from "next/link";
import { requireBusiness } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formatNaira } from "@/lib/money";
import { formatDate } from "@/lib/time";

export const metadata = { title: "Invoices" };

export default async function Invoices() {
  const { business } = await requireBusiness();
  const rows = await sql`SELECT id, number, customer_name, total_kobo, status, created_at FROM invoices
                         WHERE business_id = ${business.id} ORDER BY number DESC LIMIT 100`;
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-4xl font-bold">Invoices</h1>
        <Link href="/invoices/new" className="btn">+ New invoice</Link>
      </div>
      {rows.length === 0 ? (
        <div className="card-quiet mt-6"><p>No invoices yet. Type an order in plain words and get one in seconds.</p></div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="table min-w-[520px]">
            <thead><tr><th>#</th><th>Customer</th><th>Date</th><th className="text-right">Total</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono"><Link className="underline" href={`/invoices/${r.id}`}>{String(r.number).padStart(4, "0")}</Link></td>
                  <td>{r.customer_name}</td>
                  <td>{formatDate(r.created_at)}</td>
                  <td className="text-right font-mono">{formatNaira(r.total_kobo)}</td>
                  <td><span className={`tag ${r.status === "paid" ? "tag-solid" : ""}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
