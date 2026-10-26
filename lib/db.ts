import { neon } from "@neondatabase/serverless";

// The HTTP driver: one fast request per query, ideal for Vercel functions.
// Every query uses the tagged template, so values are always sent as parameters (no SQL injection).
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

export const sql = neon(url);
