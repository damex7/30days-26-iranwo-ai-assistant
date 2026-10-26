import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-mono">404</p>
      <h1 className="mt-2 text-4xl font-bold">Not here.</h1>
      <p className="mt-2 text-[var(--muted)]">This page doesn't exist, or it belongs to someone else.</p>
      <Link href="/dashboard" className="btn mt-6">Back home</Link>
    </main>
  );
}
