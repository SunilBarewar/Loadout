import { tool } from "ai";
import { z } from "zod";
import type { StoredChatPart } from "@/features/ui-registry/schemas/envelope";
import type { Equipment } from "@/db/schema";
import type { EquipmentPickerPartData } from "@/features/ui-registry/schemas/equipment-picker";
import { buildEquipmentPickerData } from "@/features/ui-registry/mappers/equipment-picker-data";
import { getUserProfileWithEquipment } from "@/features/users/repository";

const showEquipmentPickerSchema = z.object({
  selectionMode: z.enum(["onboarding", "profile_edit"]),
});

export type ShowEquipmentPickerResult = {
  ok: true;
  uiPart: StoredChatPart;
};

export function createShowEquipmentPickerTool(params: {
  userId: string;
  equipmentCatalog: Equipment[];
}) {
  return tool({
    description:
      "Show an interactive equipment picker card when the user needs to select or update available equipment. Only pass selectionMode — the server hydrates the catalog and current selection.",
    inputSchema: showEquipmentPickerSchema,
    execute: async ({ selectionMode }): Promise<ShowEquipmentPickerResult> => {
      const profileBundle = await getUserProfileWithEquipment(params.userId);
      const selectedSlugs = profileBundle?.equipmentSlugs ?? [];
      const catalog = profileBundle?.equipmentCatalog ?? params.equipmentCatalog;

      const data: EquipmentPickerPartData = buildEquipmentPickerData({
        selectionMode,
        catalog,
        selectedSlugs,
      });

      const uiPart: StoredChatPart = {
        id: crypto.randomUUID(),
        type: "equipment_picker",
        schemaVersion: 1,
        data,
      };

      return { ok: true, uiPart };
    },
  });
}
