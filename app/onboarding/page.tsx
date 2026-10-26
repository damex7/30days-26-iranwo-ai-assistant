import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import BusinessForm from "@/components/BusinessForm";

export const metadata = { title: "Set up your shop" };

export default async function Onboarding() {
  const user = await requireUser();
  const rows = await sql`SELECT id FROM businesses WHERE owner_id = ${user.id}`;
  if (rows[0]) redirect("/dashboard");
  return (
    <main id="main" className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <p className="eyebrow">Step 1 of 1</p>
      <h1 className="mt-2 text-4xl font-bold">Tell me about your shop, {user.name.split(" ")[0]}.</h1>
      <p className="mt-3 text-[var(--muted)]">Everything here shapes how the assistant writes for you. You can change it later.</p>
      <div className="card mt-8"><BusinessForm from="onboarding" /></div>
    </main>
  );
}
