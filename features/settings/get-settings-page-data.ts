import "server-only";

import type { User } from "@/db";
import { getUserProfileWithEquipment } from "@/features/users";
import type { SettingsPageData } from "./schemas";
import { formatEquipmentSummary } from "./formatters";

export async function getSettingsPageData(user: User): Promise<SettingsPageData> {
  const profileBundle = await getUserProfileWithEquipment(user.id);

  const equipmentSlugs = profileBundle?.equipmentSlugs ?? [];
  const catalog = profileBundle?.equipmentCatalog ?? [];
  const selectedNames = catalog
    .filter((item) => equipmentSlugs.includes(item.slug))
    .map((item) => item.name);

  const profile = profileBundle?.profile ?? user;

  return {
    displayName: profile.displayName,
    email: profile.email,
    primaryGoal: profile.primaryGoal,
    experienceLevel: profile.experienceLevel,
    defaultDaysPerWeek: profile.defaultDaysPerWeek,
    defaultSessionMinutes: profile.defaultSessionMinutes,
    limitations: profile.limitations,
    weightUnit: profile.weightUnit,
    equipmentSummary: formatEquipmentSummary(
      selectedNames,
      profile.customEquipmentNotes
    ),
    selectedEquipmentCount: equipmentSlugs.length,
  };
}
