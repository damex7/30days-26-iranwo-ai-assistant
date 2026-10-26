import { requireBusiness } from "@/lib/auth";
import { ReplyWriter } from "@/components/Writers";
import DraftHistory from "@/components/DraftHistory";

export const metadata = { title: "Customer replies" };

export default async function Replies() {
  const { business } = await requireBusiness();
  return (
    <div>
      <p className="eyebrow">Customer replies</p>
      <h1 className="mt-1 mb-6 text-4xl font-bold">Paste it. Pick a goal. Send.</h1>
      <ReplyWriter />
      <DraftHistory businessId={business.id} kind="reply" />
    </div>
  );
}
