import { notFound } from "next/navigation";
import { requireBusiness } from "@/lib/auth";
import { sql } from "@/lib/db";
import { EditInvoiceForm } from "@/components/InvoiceForms";

export const metadata = { title: "Edit invoice" };

export default async function EditInvoice({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { business } = await requireBusiness();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const inv = (await sql`SELECT id, number, customer_name, customer_phone, delivery_kobo, notes, items FROM invoices
                         WHERE id = ${id} AND business_id = ${business.id} AND status IN ('draft','sent')`)[0];
  if (!inv) notFound();
  return (
    <div className="max-w-3xl">
      <h1 className="text-4xl font-bold">Edit invoice #{String(inv.number).padStart(4, "0")}</h1>
      <div className="card mt-6">
        <EditInvoiceForm invoice={{ ...inv, delivery_kobo: Number(inv.delivery_kobo) } as Parameters<typeof EditInvoiceForm>[0]["invoice"]} />
      </div>
    </div>
  );
}
