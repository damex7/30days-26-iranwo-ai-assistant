import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { lagosDay } from "@/lib/time";
import { adminUpdateUser } from "@/app/actions";

export const metadata = { title: "Admin" };

export default async function Admin() {
  const admin = await requireAdmin();
  const def = Number(process.env.DAILY_AI_LIMIT ?? 30);
  const users = await sql`
    SELECT u.id, u.name, u.email, u.role, u.daily_limit, u.suspended, b.name AS business,
           COALESCE(t.requests, 0) AS today,
           COALESCE((SELECT SUM(input_tokens + output_tokens) FROM usage_days w WHERE w.user_id = u.id AND w.day > ${lagosDay()}::date - 7), 0) AS tokens_7d
    FROM users u
    LEFT JOIN businesses b ON b.owner_id = u.id
    LEFT JOIN usage_days t ON t.user_id = u.id AND t.day = ${lagosDay()}
    ORDER BY today DESC, u.created_at DESC LIMIT 200`;
  const totals = (await sql`SELECT COALESCE(SUM(requests),0) AS r, COALESCE(SUM(input_tokens),0) AS i, COALESCE(SUM(output_tokens),0) AS o
                            FROM usage_days WHERE day = ${lagosDay()}`)[0];

  return (
    <main id="main" className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between border-b-2 border-[var(--ink)] pb-4">
        <h1 className="text-3xl font-bold">Admin</h1>
        <Link href="/dashboard" className="text-sm underline">Back to app</Link>
      </div>
      <section className="mt-6 grid grid-cols-3 border-b-2 border-[var(--ink)] pb-4">
        {[["Requests today", totals.r], ["Input tokens", totals.i], ["Output tokens", totals.o]].map(([k, v]) => (
          <div key={k as string}><p className="eyebrow">{k as string}</p><p className="display text-3xl font-bold">{Number(v).toLocaleString()}</p></div>
        ))}
      </section>
      <p className="mt-4 text-sm text-[var(--muted)]">Default limit is {def} requests per owner per day. Set a number to override it for one owner.</p>
      <div className="mt-4 overflow-x-auto">
        <table className="table min-w-[720px]">
          <thead><tr><th>Owner</th><th>Business</th><th className="text-right">Today</th><th className="text-right">Tokens 7d</th><th>Daily limit</th><th>Access</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}<span className="block text-xs text-[var(--muted)]">{u.email}</span>{u.role === "admin" && <span className="tag">admin</span>}</td>
                <td>{u.business ?? "—"}</td>
                <td className="text-right font-mono">{u.today}/{u.daily_limit ?? def}</td>
                <td className="text-right font-mono">{Number(u.tokens_7d).toLocaleString()}</td>
                <td>
                  <form action={adminUpdateUser} className="flex gap-1">
                    <input type="hidden" name="userId" value={u.id} />
                    <label className="sr-only" htmlFor={`l-${u.id}`}>Daily limit for {u.name}</label>
                    <input id={`l-${u.id}`} name="daily_limit" type="number" min={0} max={1000} defaultValue={u.daily_limit ?? def} className="input w-20" />
                    <button className="btn-ghost text-sm">Set</button>
                  </form>
                </td>
                <td>
                  {u.role === "owner" && u.id !== admin.id ? (
                    <form action={adminUpdateUser}>
                      <input type="hidden" name="userId" value={u.id} />
                      <input type="hidden" name="suspended" value={u.suspended ? "false" : "true"} />
                      <button className={u.suspended ? "btn text-sm" : "btn-ghost text-sm"}>{u.suspended ? "Restore" : "Suspend"}</button>
                    </form>
                  ) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
