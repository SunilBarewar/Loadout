import { redirect } from "next/navigation";
import { ensureCurrentUser } from "@/features/users";
import { getSettingsPageData } from "@/features/settings/get-settings-page-data";
import { SettingsPageContent } from "@/features/settings/components/settings-page-content";

export default async function SettingsPage() {
  const user = await ensureCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const data = await getSettingsPageData(user);

  return <SettingsPageContent data={data} />;
}
