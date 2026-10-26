import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import AuthShell from "@/components/AuthShell";
import { SignupForm } from "@/components/AuthForms";

export const metadata = { title: "Create account" };

export default async function SignupPage() {
  if (await getUser()) redirect("/dashboard");
  return (
    <AuthShell title="Get your assistant." aside={<p className="mt-4 text-[var(--muted)]">Two minutes to set up. Free to try.</p>}>
      <SignupForm />
    </AuthShell>
  );
}
