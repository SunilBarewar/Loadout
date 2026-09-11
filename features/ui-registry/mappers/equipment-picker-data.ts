import type { Equipment } from "@/db/schema";
import type { EquipmentPickerPartData } from "../schemas/equipment-picker";

export function toPickerCategory(
  category: string
): EquipmentPickerPartData["availableEquipment"][number]["category"] {
  if (
    category === "free_weight" ||
    category === "machine" ||
    category === "bodyweight" ||
    category === "cardio"
  ) {
    return category;
  }

  return "free_weight";
}

export function catalogToPickerEquipment(
  catalog: Equipment[]
): EquipmentPickerPartData["availableEquipment"] {
  return catalog.map((item) => ({
    slug: item.slug,
    name: item.name,
    category: toPickerCategory(item.category),
  }));
}

export function buildEquipmentPickerData(params: {
  selectionMode: EquipmentPickerPartData["selectionMode"];
  catalog: Equipment[];
  selectedSlugs: string[];
  allowCustomNotes?: boolean;
}): EquipmentPickerPartData {
  return {
    selectionMode: params.selectionMode,
    availableEquipment: catalogToPickerEquipment(params.catalog),
    selectedSlugs: params.selectedSlugs,
    allowCustomNotes: params.allowCustomNotes ?? true,
  };
}
