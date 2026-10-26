import { readFileSync, readdirSync } from "node:fs";
import { Pool } from "@neondatabase/serverless";

// Loads .env.local first (Next.js convention), then .env
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing. Copy .env.example to .env.local and fill it in.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const files = readdirSync("sql").filter((f) => f.endsWith(".sql")).sort();
for (const f of files) {
  console.log(`Running ${f}`);
  await pool.query(readFileSync(`sql/${f}`, "utf8"));
}
await pool.end();
console.log("Migrations done.");
