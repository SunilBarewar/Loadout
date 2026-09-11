import { z } from "zod";

export const planningFactsInputSchema = z
  .object({
    primaryGoal: z.enum([
      "hypertrophy",
      "strength",
      "fat_loss",
      "endurance",
      "general_fitness",
    ]),
    experienceLevel: z.enum(["beginner", "intermediate", "advanced"]),
    defaultDaysPerWeek: z.number().int().min(1).max(7),
    defaultSessionMinutes: z.number().int().min(10).max(240),
    equipmentSlugs: z.array(z.string()).min(1),
    limitations: z.string().nullable(),
    limitationsConfirmedNone: z.boolean(),
    weightUnit: z.enum(["kg", "lb"]),
    skipRemainingSlots: z.boolean(),
  })
  .partial();

export type PlanningFactsInput = z.infer<typeof planningFactsInputSchema>;
