// All money is stored as integer kobo (₦1 = 100 kobo) so sums are always exact.
export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}

export function formatNaira(kobo: number | string | bigint): string {
  const n = Number(kobo) / 100;
  return "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export type InvoiceItem = { description: string; quantity: number; unit_kobo: number };

// The AI never does the arithmetic. These totals are computed on the server.
export function invoiceTotals(items: InvoiceItem[], deliveryKobo: number) {
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unit_kobo, 0);
  return { subtotal, total: subtotal + deliveryKobo };
}

// 08031234567 → 2348031234567 (the format wa.me links need)
export function waNumber(phone: string): string {
  const d = phone.replace(/\D/g, "");
  return d.startsWith("0") ? "234" + d.slice(1) : d;
}
