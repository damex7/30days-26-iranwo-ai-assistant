import { NewInvoiceForm } from "@/components/InvoiceForms";

export const metadata = { title: "New invoice" };

export default function NewInvoice() {
  return (
    <div className="max-w-2xl">
      <p className="eyebrow">Invoice from a sentence</p>
      <h1 className="mt-1 text-4xl font-bold">What did they buy?</h1>
      <div className="card mt-6"><NewInvoiceForm /></div>
    </div>
  );
}
