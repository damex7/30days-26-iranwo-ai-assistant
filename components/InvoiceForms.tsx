"use client";

import { useActionState, useState } from "react";
import { createInvoiceFromText, updateInvoice, type FormState } from "@/app/actions";
import { Field, Submit } from "./Form";
import { formatNaira } from "@/lib/money";

const EXAMPLE = "Mrs Adeyemi 08031234567 bought 2 Ankara (6 yards) at 18,500 each and 1 gele for 7k. Delivery to Surulere 3,500. Pay before dispatch.";

export function NewInvoiceForm() {
  const [state, action] = useActionState<FormState, FormData>(createInvoiceFromText, {});
  const [text, setText] = useState("");
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.message && <p role="alert" className="alert">{state.message}</p>}
      <Field name="text" label="Describe the order the way you'd text it" as="textarea" rows={5} value={text}
        onChange={(e) => setText(e.target.value)} placeholder={EXAMPLE} error={state.errors?.text}
        hint="Customer, items, quantities, prices (45k is fine) and delivery. The totals are worked out by the app, not the AI." />
      <div className="flex flex-wrap gap-3">
        <Submit pending="Reading your order…">Make invoice</Submit>
        <button type="button" className="btn-ghost" onClick={() => setText(EXAMPLE)}>Use example</button>
      </div>
    </form>
  );
}

type Row = { description: string; quantity: number; unit_naira: number };

export function EditInvoiceForm({ invoice }: {
  invoice: { id: string; customer_name: string; customer_phone: string | null; delivery_kobo: number; notes: string | null; items: { description: string; quantity: number; unit_kobo: number }[] };
}) {
  const [state, action] = useActionState<FormState, FormData>(updateInvoice, {});
  const [rows, setRows] = useState<Row[]>(invoice.items.map((i) => ({ description: i.description, quantity: i.quantity, unit_naira: i.unit_kobo / 100 })));
  const [delivery, setDelivery] = useState(invoice.delivery_kobo / 100);
  const e = state.errors ?? {};
  // A preview total for the screen only; the server recalculates on save.
  const preview = Math.round(rows.reduce((s, r) => s + (Number(r.quantity) || 0) * (Number(r.unit_naira) || 0) * 100, 0) + (Number(delivery) || 0) * 100);
  const set = (i: number, k: keyof Row, v: string) => setRows((r) => r.map((row, j) => (j === i ? { ...row, [k]: k === "description" ? v : Number(v) } : row)));

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="id" value={invoice.id} />
      <input type="hidden" name="items" value={JSON.stringify(rows)} />
      {state.message && <p role="alert" className="alert">{state.message}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="customer_name" label="Customer" defaultValue={invoice.customer_name} error={e.customer_name} />
        <Field name="customer_phone" label="Customer phone" type="tel" defaultValue={invoice.customer_phone ?? ""} error={e.customer_phone} />
      </div>

      <fieldset>
        <legend className="label">Items</legend>
        {e.items && <p className="err" role="alert">{e.items}</p>}
        <div className="space-y-3">
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-[1fr_4.5rem] gap-2 border-b border-[var(--line)] pb-3 sm:grid-cols-[1fr_5rem_8rem_auto]">
              <input aria-label={`Item ${i + 1} description`} className="input col-span-2 sm:col-span-1" value={r.description} onChange={(ev) => set(i, "description", ev.target.value)} />
              <input aria-label={`Item ${i + 1} quantity`} className="input" type="number" min={1} value={r.quantity} onChange={(ev) => set(i, "quantity", ev.target.value)} />
              <input aria-label={`Item ${i + 1} price in naira`} className="input" type="number" min={0} step="0.01" value={r.unit_naira} onChange={(ev) => set(i, "unit_naira", ev.target.value)} />
              <button type="button" className="btn-ghost justify-center" aria-label={`Remove item ${i + 1}`} disabled={rows.length === 1}
                onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
          {Object.entries(e).filter(([k]) => k.startsWith("items.")).map(([k, v]) => <p key={k} className="err" role="alert">Item {Number(k.split(".")[1]) + 1}: {v}</p>)}
        </div>
        <button type="button" className="btn-ghost mt-3" onClick={() => setRows((r) => [...r, { description: "", quantity: 1, unit_naira: 0 }])}>+ Add item</button>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="delivery_naira" label="Delivery (₦)" type="number" min={0} value={delivery} onChange={(ev) => setDelivery(Number(ev.target.value))} error={e.delivery_naira} />
        <Field name="notes" label="Notes" defaultValue={invoice.notes ?? ""} error={e.notes} />
      </div>
      <p className="display text-2xl font-bold">Total {formatNaira(preview)}</p>
      <Submit pending="Saving…">Save invoice</Submit>
    </form>
  );
}
