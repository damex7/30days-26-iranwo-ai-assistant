import Link from "next/link";

export default function AuthShell({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <main id="main" className="mx-auto grid min-h-dvh max-w-5xl gap-8 px-4 py-8 sm:px-6 md:grid-cols-2 md:items-center">
      <div>
        <Link href="/" className="display text-2xl font-bold">Ìrànwọ́</Link>
        <h1 className="mt-6 text-4xl font-bold">{title}</h1>
        {aside}
      </div>
      <div className="card">{children}</div>
    </main>
  );
}
