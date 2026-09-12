import { z } from "zod";
import {
  experienceLevelSchema,
  weightUnitSchema,
} from "@/features/ai/schemas/planning-facts";
import { trainingGoalSchema } from "@/features/plans/schemas";
import type { EquipmentPickerPartData } from "@/features/ui-registry/schemas/equipment-picker";

export const updateSettingsInputSchema = z.object({
  primaryGoal: trainingGoalSchema.nullable(),
  experienceLevel: experienceLevelSchema.nullable(),
  defaultDaysPerWeek: z.number().int().min(1).max(7).nullable(),
  defaultSessionMinutes: z.number().int().min(10).max(240).nullable(),
  limitations: z.string().nullable(),
});

export const saveEquipmentInputSchema = z.object({
  equipmentSlugs: z.array(z.string()).min(1),
  customEquipmentNotes: z.string().nullable(),
  weightUnit: weightUnitSchema,
});

export type TrainingGoal = z.infer<typeof trainingGoalSchema>;
export type ExperienceLevel = z.infer<typeof experienceLevelSchema>;
export type WeightUnit = z.infer<typeof weightUnitSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsInputSchema>;
export type SaveEquipmentInput = z.infer<typeof saveEquipmentInputSchema>;

export type SettingsPageData = {
  displayName: string | null;
  email: string | null;
  primaryGoal: TrainingGoal | null;
  experienceLevel: ExperienceLevel | null;
  defaultDaysPerWeek: number | null;
  defaultSessionMinutes: number | null;
  limitations: string | null;
  weightUnit: WeightUnit;
  equipmentSummary: string;
  selectedEquipmentCount: number;
};

export type EquipmentPageData = {
  equipmentPicker: EquipmentPickerPartData;
  customEquipmentNotes: string | null;
  weightUnit: WeightUnit;
};

export type UserMenuData = {
  activePlanTitle: string | null;
};
