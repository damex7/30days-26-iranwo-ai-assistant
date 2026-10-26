"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { createSession, destroySession, requireAdmin, requireBusiness, requireUser } from "@/lib/auth";
import { takeAiCredit, recordTokens } from "@/lib/usage";
import { extractInvoice, draftReplies, writePost, type ReplyDraft, type PostDraft } from "@/lib/ai";
import { invoiceTotals, nairaToKobo } from "@/lib/money";
import {
  AdminUserSchema, BusinessSchema, InvoiceEditSchema, InvoiceTextSchema, LoginSchema,
  PostSchema, ReplySchema, SignupSchema, StatusSchema, fieldErrors,
} from "@/lib/validation";

export type FormState = { errors?: Record<string, string>; message?: string };
const LIMIT_MSG = (limit: number) => `You've used all ${limit} AI requests for today. It resets at midnight, Lagos time.`;

/* ---------------- Auth ---------------- */

export async function signup(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = SignupSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const { name, email, password } = parsed.data;
  const hash = await bcrypt.hash(password, 10);
  const rows = await sql`
    INSERT INTO users (name, email, password_hash) VALUES (${name}, ${email}, ${hash})
    ON CONFLICT (email) DO NOTHING RETURNING id`;
  if (!rows[0]) return { errors: { email: "An account with this email already exists" } };
  await createSession(rows[0].id);
  redirect("/onboarding");
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = LoginSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const rows = await sql`SELECT id, password_hash, role, suspended FROM users WHERE email = ${parsed.data.email}`;
  const u = rows[0];
  // Same message for "no such user" and "wrong password", so emails can't be probed.
  if (!u || !(await bcrypt.compare(parsed.data.password, u.password_hash))) {
    return { message: "Email or password is wrong" };
  }
  if (u.suspended) return { message: "This account is suspended. Contact the admin." };
  await createSession(u.id);
  redirect(u.role === "admin" ? "/admin" : "/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

/* ---------------- Business profile ---------------- */

export async function saveBusiness(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = BusinessSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const b = parsed.data;
  // owner_id comes from the session; ON CONFLICT means one business per owner.
  await sql`
    INSERT INTO businesses (owner_id, name, what_we_sell, city, state, tone, whatsapp, bank_name, account_name, account_no, policies)
    VALUES (${user.id}, ${b.name}, ${b.what_we_sell}, ${b.city}, ${b.state}, ${b.tone}, ${b.whatsapp}, ${b.bank_name}, ${b.account_name}, ${b.account_no}, ${b.policies})
    ON CONFLICT (owner_id) DO UPDATE SET
      name = EXCLUDED.name, what_we_sell = EXCLUDED.what_we_sell, city = EXCLUDED.city, state = EXCLUDED.state,
      tone = EXCLUDED.tone, whatsapp = EXCLUDED.whatsapp, bank_name = EXCLUDED.bank_name,
      account_name = EXCLUDED.account_name, account_no = EXCLUDED.account_no, policies = EXCLUDED.policies`;
  if (fd.get("from") === "onboarding") redirect("/dashboard");
  revalidatePath("/", "layout");
  return { message: "Saved" };
}

/* ---------------- Invoices ---------------- */

export async function createInvoiceFromText(_: FormState, fd: FormData): Promise<FormState> {
  const { user, business } = await requireBusiness();
  const parsed = InvoiceTextSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const credit = await takeAiCredit(user);
  if (!credit.ok) return { message: LIMIT_MSG(credit.limit) };

  let draft;
  try {
    draft = await extractInvoice(business, parsed.data.text);
  } catch (e) {
    return { message: e instanceof Error ? e.message : "The AI is not available right now" };
  }
  await recordTokens(user.id, draft.usage.input, draft.usage.output);

  // The AI suggested items; the server cleans them and does every sum in kobo.
  const items = draft.data.items
    .filter((i) => i.description.trim() && i.quantity > 0 && i.unit_price_naira >= 0)
    .map((i) => ({ description: i.description.trim().slice(0, 120), quantity: Math.min(i.quantity, 10_000), unit_kobo: nairaToKobo(i.unit_price_naira) }));
  if (items.length === 0) return { message: "I couldn't find any items with prices. Add quantities and prices, e.g. '2 bags of rice at 45k each'." };
  const delivery = nairaToKobo(Math.max(0, draft.data.delivery_naira));
  const { subtotal, total } = invoiceTotals(items, delivery);

  // One statement: bump this business's counter AND insert with the new number. No duplicates, no gaps from races.
  const rows = await sql`
    WITH seq AS (
      UPDATE businesses SET invoice_seq = invoice_seq + 1 WHERE id = ${business.id} RETURNING invoice_seq
    )
    INSERT INTO invoices (business_id, number, customer_name, customer_phone, items, delivery_kobo, subtotal_kobo, total_kobo, notes, source_text)
    SELECT ${business.id}, seq.invoice_seq, ${draft.data.customer_name.slice(0, 80) || "Customer"}, ${draft.data.customer_phone},
           ${JSON.stringify(items)}::jsonb, ${delivery}, ${subtotal}, ${total}, ${draft.data.notes}, ${parsed.data.text}
    FROM seq RETURNING id`;
  redirect(`/invoices/${rows[0].id}?new=1`);
}

export async function updateInvoice(_: FormState, fd: FormData): Promise<FormState> {
  const { business } = await requireBusiness();
  let payload: unknown;
  try {
    payload = { ...Object.fromEntries(fd), items: JSON.parse(String(fd.get("items") ?? "[]")) };
  } catch {
    return { message: "Items could not be read" };
  }
  const parsed = InvoiceEditSchema.safeParse(payload);
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const v = parsed.data;
  const items = v.items.map((i) => ({ description: i.description, quantity: i.quantity, unit_kobo: nairaToKobo(i.unit_naira) }));
  const delivery = nairaToKobo(v.delivery_naira);
  const { subtotal, total } = invoiceTotals(items, delivery);
  // WHERE business_id = ... : you can only edit an invoice that belongs to YOUR business.
  const rows = await sql`
    UPDATE invoices SET customer_name = ${v.customer_name}, customer_phone = ${v.customer_phone},
      items = ${JSON.stringify(items)}::jsonb, delivery_kobo = ${delivery}, subtotal_kobo = ${subtotal},
      total_kobo = ${total}, notes = ${v.notes}
    WHERE id = ${v.id} AND business_id = ${business.id} AND status IN ('draft','sent') RETURNING id`;
  if (!rows[0]) return { message: "Invoice not found, or it is already paid or cancelled" };
  redirect(`/invoices/${v.id}`);
}

export async function setInvoiceStatus(fd: FormData) {
  const { business } = await requireBusiness();
  const parsed = StatusSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  await sql`UPDATE invoices SET status = ${parsed.data.status} WHERE id = ${parsed.data.id} AND business_id = ${business.id}`;
  revalidatePath(`/invoices/${parsed.data.id}`);
  revalidatePath("/invoices");
}

/* ---------------- Writers ---------------- */

export type ReplyState = FormState & { result?: ReplyDraft };
export async function replyAction(_: ReplyState, fd: FormData): Promise<ReplyState> {
  const { user, business } = await requireBusiness();
  const parsed = ReplySchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const credit = await takeAiCredit(user);
  if (!credit.ok) return { message: LIMIT_MSG(credit.limit) };
  try {
    const { data, usage } = await draftReplies(business, parsed.data.customer_message, parsed.data.goal);
    await recordTokens(user.id, usage.input, usage.output);
    await sql`INSERT INTO drafts (business_id, kind, input, output) VALUES (${business.id}, 'reply', ${parsed.data.customer_message}, ${JSON.stringify(data)}::jsonb)`;
    revalidatePath("/replies");
    return { result: data };
  } catch (e) {
    return { message: e instanceof Error ? e.message : "The AI is not available right now" };
  }
}

export type PostState = FormState & { result?: PostDraft };
export async function postAction(_: PostState, fd: FormData): Promise<PostState> {
  const { user, business } = await requireBusiness();
  const parsed = PostSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const credit = await takeAiCredit(user);
  if (!credit.ok) return { message: LIMIT_MSG(credit.limit) };
  try {
    const { data, usage } = await writePost(business, parsed.data.product, parsed.data.details);
    await recordTokens(user.id, usage.input, usage.output);
    await sql`INSERT INTO drafts (business_id, kind, input, output) VALUES (${business.id}, 'post', ${parsed.data.product}, ${JSON.stringify(data)}::jsonb)`;
    revalidatePath("/posts");
    return { result: data };
  } catch (e) {
    return { message: e instanceof Error ? e.message : "The AI is not available right now" };
  }
}

export async function deleteConversation(fd: FormData) {
  const { business } = await requireBusiness();
  const id = String(fd.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  await sql`DELETE FROM conversations WHERE id = ${id} AND business_id = ${business.id}`;
  redirect("/chat");
}

/* ---------------- Admin ---------------- */

export async function adminUpdateUser(fd: FormData) {
  const admin = await requireAdmin();
  const parsed = AdminUserSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success || parsed.data.userId === admin.id) return; // an admin can't suspend themselves
  const { userId, daily_limit, suspended } = parsed.data;
  if (daily_limit !== undefined) await sql`UPDATE users SET daily_limit = ${daily_limit} WHERE id = ${userId}`;
  if (suspended !== undefined) {
    await sql`UPDATE users SET suspended = ${suspended === "true"} WHERE id = ${userId} AND role = 'owner'`;
    if (suspended === "true") await sql`DELETE FROM sessions WHERE user_id = ${userId}`; // log them out everywhere
  }
  revalidatePath("/admin");
}
