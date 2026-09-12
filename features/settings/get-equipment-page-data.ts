import "server-only";

import type { User } from "@/db";
import { getUserProfileWithEquipment } from "@/features/users";
import { buildEquipmentPickerData } from "@/features/ui-registry/mappers/equipment-picker-data";
import type { EquipmentPageData } from "./schemas";

export async function getEquipmentPageData(user: User): Promise<EquipmentPageData> {
  const profileBundle = await getUserProfileWithEquipment(user.id);

  const equipmentSlugs = profileBundle?.equipmentSlugs ?? [];
  const catalog = profileBundle?.equipmentCatalog ?? [];
  const profile = profileBundle?.profile ?? user;

  return {
    equipmentPicker: buildEquipmentPickerData({
      selectionMode: "profile_edit",
      catalog,
      selectedSlugs: equipmentSlugs,
      allowCustomNotes: true,
    }),
    customEquipmentNotes: profile.customEquipmentNotes,
    weightUnit: profile.weightUnit,
  };
}
