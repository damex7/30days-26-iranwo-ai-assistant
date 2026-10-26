import "server-only";
import { sql } from "./db";
import { lagosDay } from "./time";
import type { User } from "./auth";

export function limitFor(user: Pick<User, "daily_limit">): number {
  return user.daily_limit ?? Number(process.env.DAILY_AI_LIMIT ?? 30);
}

/**
 * Reserve one AI request for today, or refuse if the limit is reached.
 *
 * The check and the +1 are ONE SQL statement. If the row is already at the limit,
 * the WHERE on the DO UPDATE stops the update and RETURNING gives no row.
 * Two requests arriving at the same moment cannot both squeeze past the limit,
 * because Postgres locks the row while it updates it.
 */
export async function takeAiCredit(user: User): Promise<{ ok: boolean; used: number; limit: number }> {
  const limit = limitFor(user);
  if (limit <= 0) return { ok: false, used: 0, limit };
  const rows = await sql`
    INSERT INTO usage_days (user_id, day, requests) VALUES (${user.id}, ${lagosDay()}, 1)
    ON CONFLICT (user_id, day) DO UPDATE SET requests = usage_days.requests + 1
    WHERE usage_days.requests < ${limit}
    RETURNING requests`;
  if (!rows[0]) return { ok: false, used: limit, limit };
  return { ok: true, used: Number(rows[0].requests), limit };
}

export async function recordTokens(userId: string, input: number, output: number) {
  await sql`
    UPDATE usage_days SET input_tokens = input_tokens + ${input}, output_tokens = output_tokens + ${output}
    WHERE user_id = ${userId} AND day = ${lagosDay()}`;
}

export async function usageToday(user: User) {
  const rows = await sql`SELECT requests FROM usage_days WHERE user_id = ${user.id} AND day = ${lagosDay()}`;
  return { used: Number(rows[0]?.requests ?? 0), limit: limitFor(user) };
}
