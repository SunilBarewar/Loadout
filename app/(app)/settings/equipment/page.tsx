import { redirect } from "next/navigation";
import { ensureCurrentUser } from "@/features/users";
import { getEquipmentPageData } from "@/features/settings/get-equipment-page-data";
import { EquipmentPageContent } from "@/features/settings/components/equipment-page-content";

export default async function EquipmentSettingsPage() {
  const user = await ensureCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const data = await getEquipmentPageData(user);

  return <EquipmentPageContent data={data} />;
}
