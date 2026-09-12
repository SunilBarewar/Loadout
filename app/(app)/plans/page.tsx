import { redirect } from "next/navigation";
import { ensureCurrentUser } from "@/features/users";
import { getPlansPageData } from "@/features/plans/get-plans-page-data";
import { PlansPageContent } from "@/features/plans/components/plans-page-content";

export default async function PlansPage() {
  const user = await ensureCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const data = await getPlansPageData(user);

  return <PlansPageContent data={data} />;
}
