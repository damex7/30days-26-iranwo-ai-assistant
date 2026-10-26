import Link from "next/link";
import { getUser } from "@/lib/auth";

const TOOLS = [
  ["01", "Invoice from a sentence", "Type “2 bags of rice at 45k, delivery 3,500 to Mrs Ade”. Get a clean invoice with exact totals, ready for WhatsApp."],
  ["02", "Customer replies", "Paste a customer's message, pick a goal, get three replies in your shop's voice."],
  ["03", "Product posts", "Instagram caption, WhatsApp status and an X post for any product, in one go."],
  ["04", "Ask anything", "A chat assistant that already knows what you sell, where you are and how you talk."],
];

export default async function Home() {
  const user = await getUser();
  return (
    <main id="main" className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="flex items-center justify-between border-b-2 border-[var(--ink)] pb-4">
        <span className="display text-2xl font-bold">Ìrànwọ́</span>
        <nav className="flex gap-2">
          {user ? <Link className="btn" href="/dashboard">Open app</Link> : <>
            <Link className="btn-ghost" href="/login">Log in</Link>
            <Link className="btn" href="/signup">Start free</Link>
          </>}
        </nav>
      </header>

      <section className="py-14 sm:py-20">
        <p className="eyebrow">Yoruba for “help”</p>
        <h1 className="mt-3 max-w-3xl text-5xl font-bold leading-[1.05] sm:text-7xl">The assistant that knows your shop.</h1>
        <p className="mt-6 max-w-xl text-lg text-[var(--muted)]">
          Tell Ìrànwọ́ about your business once. Then let it draft your invoices, customer replies and product posts while you get back to selling.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="btn" href={user ? "/dashboard" : "/signup"}>Set up my shop</Link>
          <Link className="btn-ghost" href="/login">Try the demo shop</Link>
        </div>
      </section>

      <section aria-labelledby="tools" className="grid gap-0 border-t-2 border-[var(--ink)] sm:grid-cols-2">
        <h2 id="tools" className="sr-only">What it does</h2>
        {TOOLS.map(([n, t, d]) => (
          <article key={n} className="border-b border-[var(--line)] py-6 sm:pr-8 sm:odd:border-r sm:even:pl-8">
            <p className="font-mono text-sm">{n}</p>
            <h3 className="display mt-2 text-2xl font-bold">{t}</h3>
            <p className="mt-2 text-[var(--muted)]">{d}</p>
          </article>
        ))}
      </section>

      <footer className="mt-12 flex flex-wrap justify-between gap-2 border-t-2 border-[var(--ink)] pt-4 text-sm text-[var(--muted)]">
        <span>Day 26 of a 30-day build challenge.</span>
        <span>AI drafts can be wrong. Always check before you send.</span>
      </footer>
    </main>
  );
}
