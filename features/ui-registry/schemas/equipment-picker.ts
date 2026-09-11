import { z } from "zod";

const equipmentCategorySchema = z.enum([
  "free_weight",
  "machine",
  "bodyweight",
  "cardio",
]);

export const equipmentPickerPartDataSchema = z.object({
  selectionMode: z.enum(["onboarding", "profile_edit"]),
  availableEquipment: z.array(
    z.object({
      slug: z.string(),
      name: z.string(),
      category: equipmentCategorySchema,
    })
  ),
  selectedSlugs: z.array(z.string()),
  allowCustomNotes: z.boolean(),
});

export type EquipmentPickerPartData = z.infer<
  typeof equipmentPickerPartDataSchema
>;
