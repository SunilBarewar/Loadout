import { z } from "zod";
import { trainingGoalSchema } from "@/features/plans/schemas";

export const experienceLevelSchema = z.enum([
  "beginner",
  "intermediate",
  "advanced",
]);

export const weightUnitSchema = z.enum(["kg", "lb"]);

export const planningFactsInputSchema = z
  .object({
    primaryGoal: trainingGoalSchema,
    experienceLevel: experienceLevelSchema,
    defaultDaysPerWeek: z.number().int().min(1).max(7),
    defaultSessionMinutes: z.number().int().min(10).max(240),
    equipmentSlugs: z.array(z.string()).min(1),
    limitations: z.string().nullable(),
    limitationsConfirmedNone: z.boolean(),
    weightUnit: weightUnitSchema,
    customEquipmentNotes: z.string().nullable(),
    skipRemainingSlots: z.boolean(),
  })
  .partial();

export type PlanningFactsInput = z.infer<typeof planningFactsInputSchema>;
