import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import AuthShell from "@/components/AuthShell";
import { LoginForm } from "@/components/AuthForms";

export const metadata = { title: "Log in" };

export default async function LoginPage() {
  if (await getUser()) redirect("/dashboard");
  return (
    <AuthShell title="Welcome back." aside={
      <div className="mt-6 border-l-2 border-[var(--ink)] pl-4 text-sm">
        <p className="eyebrow">Demo shop</p>
        <p className="mt-1">demo@iranwo.ng · <span className="font-mono">demo12345</span></p>
      </div>
    }>
      <LoginForm />
    </AuthShell>
  );
}
