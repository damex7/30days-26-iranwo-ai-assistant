import { requireBusiness } from "@/lib/auth";
import { PostWriter } from "@/components/Writers";
import DraftHistory from "@/components/DraftHistory";

export const metadata = { title: "Product posts" };

export default async function Posts() {
  const { business } = await requireBusiness();
  return (
    <div>
      <p className="eyebrow">Product posts</p>
      <h1 className="mt-1 mb-6 text-4xl font-bold">One product, three platforms.</h1>
      <PostWriter />
      <DraftHistory businessId={business.id} kind="post" />
    </div>
  );
}
