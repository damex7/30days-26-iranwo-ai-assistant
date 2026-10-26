import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import { sql } from "./db";

const COOKIE = "iranwo_session";
const DAYS = 30;

export type User = { id: string; email: string; name: string; role: "owner" | "admin"; daily_limit: number | null };
export type Business = {
  id: string; name: string; what_we_sell: string; city: string; state: string; tone: string;
  whatsapp: string; bank_name: string | null; account_name: string | null; account_no: string | null; policies: string | null;
};

const hash = (t: string) => createHash("sha256").update(t).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + DAYS * 86400_000);
  await sql`INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (${hash(token)}, ${userId}, ${expires.toISOString()})`;
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await sql`DELETE FROM sessions WHERE token_hash = ${hash(token)}`;
  jar.delete(COOKIE);
}

export async function getUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const rows = await sql`
    SELECT u.id, u.email, u.name, u.role, u.daily_limit
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ${hash(token)} AND s.expires_at > now() AND u.suspended = false`;
  return (rows[0] as User) ?? null;
}

export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}

// The business is ALWAYS looked up from the logged-in user, never from a URL or form field.
// Every other query then filters by this business id, which is how ownership is enforced.
export async function requireBusiness(): Promise<{ user: User; business: Business }> {
  const user = await requireUser();
  const rows = await sql`SELECT * FROM businesses WHERE owner_id = ${user.id}`;
  if (!rows[0]) redirect("/onboarding");
  return { user, business: rows[0] as Business };
}
