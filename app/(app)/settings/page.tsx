import { requireBusiness } from "@/lib/auth";
import BusinessForm from "@/components/BusinessForm";

export const metadata = { title: "Your shop" };

export default async function Settings() {
  const { business } = await requireBusiness();
  return (
    <div className="max-w-2xl">
      <h1 className="text-4xl font-bold">Your shop</h1>
      <p className="mt-2 text-[var(--muted)]">The assistant reads this before every answer. Better details, better drafts.</p>
      <div className="card mt-6"><BusinessForm business={business} from="settings" /></div>
    </div>
  );
}
