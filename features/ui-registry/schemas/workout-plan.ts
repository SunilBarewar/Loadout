import { z } from "zod";

export const workoutPlanPartDataSchema = z.object({
  planId: z.string().uuid(),
  versionId: z.string().uuid(),
  state: z.enum(["draft", "saved", "active"]),
  title: z.string(),
  goal: z.string().nullable(),
  daysPerWeek: z.number().int().min(1).max(7),
  estimatedWeeklyMinutes: z.number().int().nullable(),
  summary: z.string().nullable(),
});

export type WorkoutPlanPartData = z.infer<typeof workoutPlanPartDataSchema>;
