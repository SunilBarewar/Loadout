"use server";

import { revalidatePath } from "next/cache";
import {
  ensureCurrentUser,
  setUserEquipmentSlugs,
  updateUserPlanningProfile,
} from "@/features/users";
import {
  saveEquipmentInputSchema,
  updateSettingsInputSchema,
  type SaveEquipmentInput,
  type UpdateSettingsInput,
} from "./schemas";

export type UpdateSettingsResult =
  | { ok: true }
  | { ok: false; error: string };

export type SaveEquipmentResult =
  | { ok: true; slugs: string[] }
  | { ok: false; error: string };

function revalidateSettingsPaths() {
  revalidatePath("/settings");
  revalidatePath("/settings/equipment");
  revalidatePath("/today");
  revalidatePath("/planner");
}

export async function updateSettingsAction(
  input: UpdateSettingsInput
): Promise<UpdateSettingsResult> {
  const user = await ensureCurrentUser();
  if (!user) {
    return { ok: false, error: "You must be signed in to update settings." };
  }

  const parsed = updateSettingsInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid settings data." };
  }

  await updateUserPlanningProfile(user.id, parsed.data);

  revalidateSettingsPaths();
  return { ok: true };
}

export async function saveEquipmentAction(
  input: SaveEquipmentInput
): Promise<SaveEquipmentResult> {
  const user = await ensureCurrentUser();
  if (!user) {
    return { ok: false, error: "You must be signed in to save equipment." };
  }

  const parsed = saveEquipmentInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid equipment data." };
  }

  const validSlugs = await setUserEquipmentSlugs(
    user.id,
    parsed.data.equipmentSlugs
  );

  if (validSlugs.length === 0) {
    return {
      ok: false,
      error: "None of the selected equipment is in the catalog.",
    };
  }

  await updateUserPlanningProfile(user.id, {
    customEquipmentNotes: parsed.data.customEquipmentNotes,
    weightUnit: parsed.data.weightUnit,
  });

  revalidateSettingsPaths();
  return { ok: true, slugs: validSlugs };
}
