import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) { console.error("DATABASE_URL is missing."); process.exit(1); }
const sql = neon(process.env.DATABASE_URL);

async function user(email, name, password, role = "owner") {
  const hash = await bcrypt.hash(password, 10);
  const rows = await sql`INSERT INTO users (email, name, password_hash, role) VALUES (${email}, ${name}, ${hash}, ${role})
                         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, suspended = false
                         RETURNING id`;
  return rows[0].id;
}

async function business(ownerId, b) {
  const rows = await sql`INSERT INTO businesses (owner_id, name, what_we_sell, city, state, tone, whatsapp, bank_name, account_name, account_no, policies)
    VALUES (${ownerId}, ${b.name}, ${b.sell}, ${b.city}, ${b.state}, ${b.tone}, ${b.wa}, ${b.bank}, ${b.accName}, ${b.accNo}, ${b.policies})
    ON CONFLICT (owner_id) DO UPDATE SET name = EXCLUDED.name RETURNING id`;
  return rows[0].id;
}

async function invoice(bizId, customer, phone, items, delivery, status) {
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_kobo, 0);
  await sql`WITH seq AS (UPDATE businesses SET invoice_seq = invoice_seq + 1 WHERE id = ${bizId} RETURNING invoice_seq)
            INSERT INTO invoices (business_id, number, customer_name, customer_phone, items, delivery_kobo, subtotal_kobo, total_kobo, status)
            SELECT ${bizId}, invoice_seq, ${customer}, ${phone}, ${JSON.stringify(items)}::jsonb, ${delivery}, ${subtotal}, ${subtotal + delivery}, ${status} FROM seq`;
}

await user("admin@iranwo.ng", "Admin", "admin12345", "admin");

const demo = await user("demo@iranwo.ng", "Adaeze Okafor", "demo12345");
const demoBiz = await business(demo, {
  name: "Ada's Fabric House", sell: "Ankara and Aso-oke fabrics, gele, and ready-made outfits for women",
  city: "Surulere", state: "Lagos", tone: "friendly", wa: "08031234567",
  bank: "GTBank", accName: "Ada's Fabric House", accNo: "0123456789",
  policies: "Delivery in Lagos 1–2 days (₦3,500 mainland, ₦5,000 island). Outside Lagos 3–5 days via GIG. No refunds on cut fabric. Open Mon–Sat, 9am–7pm.",
});

const second = await user("musa@iranwo.ng", "Musa Bello", "demo12345");
await business(second, {
  name: "Bello Gadgets", sell: "Phone accessories, power banks, chargers and earbuds",
  city: "Wuse", state: "FCT", tone: "formal", wa: "08059876543",
  bank: "Access Bank", accName: "Bello Gadgets Ltd", accNo: "0987654321",
  policies: "7-day replacement on faulty items with receipt. Delivery within Abuja ₦2,500.",
});

const count = await sql`SELECT COUNT(*)::int AS n FROM invoices WHERE business_id = ${demoBiz}`;
if (count[0].n === 0) {
  await invoice(demoBiz, "Mrs Adeyemi", "08031112222", [{ description: "Ankara fabric (6 yards)", quantity: 2, unit_kobo: 1850000 }, { description: "Gele", quantity: 1, unit_kobo: 700000 }], 350000, "paid");
  await invoice(demoBiz, "Chioma N.", "08123334444", [{ description: "Aso-oke set (wine & gold)", quantity: 1, unit_kobo: 6500000 }], 500000, "sent");
  await invoice(demoBiz, "Tunde & Co.", null, [{ description: "Ready-made agbada", quantity: 3, unit_kobo: 4200000 }], 0, "draft");
}

console.log("Seeded.\n  demo@iranwo.ng / demo12345  (Ada's Fabric House)\n  musa@iranwo.ng / demo12345  (Bello Gadgets)\n  admin@iranwo.ng / admin12345 (admin)");
