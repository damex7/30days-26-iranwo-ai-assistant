import Link from "next/link";
import { requireBusiness } from "@/lib/auth";
import { usageToday } from "@/lib/usage";
import { logout } from "@/app/actions";
import Nav from "@/components/Nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, business } = await requireBusiness();
  const { used, limit } = await usageToday(user);
  const pct = Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <header className="no-print border-b-2 border-[var(--ink)] pt-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/dashboard" className="min-w-0">
            <span className="display text-xl font-bold">Ìrànwọ́</span>
            <span className="ml-2 truncate text-sm text-[var(--muted)]">for {business.name}</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block" title="AI requests used today">
              <p className="font-mono text-xs">{used}/{limit} today</p>
              <div className="mt-1 h-1.5 w-24 border border-[var(--ink)]" role="progressbar" aria-label="AI requests used today" aria-valuenow={used} aria-valuemin={0} aria-valuemax={limit}>
                <div className="h-full bg-[var(--ink)]" style={{ width: `${pct}%` }} />
              </div>
            </div>
            {user.role === "admin" && <Link href="/admin" className="tag">Admin</Link>}
            <form action={logout}><button className="text-sm underline">Log out</button></form>
          </div>
        </div>
        <div className="mt-3"><Nav /></div>
      </header>
      <main id="main" className="py-8">{children}</main>
    </div>
  );
}
