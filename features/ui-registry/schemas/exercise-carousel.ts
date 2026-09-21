import { z } from "zod";

export const exerciseAlternativeSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  primaryMuscle: z.string(),
  equipmentSlug: z.string().nullable(),
  rationale: z.string(),
  targetSets: z.number().int().min(1),
  targetRepsMin: z.number().int().min(1),
  targetRepsMax: z.number().int().min(1),
  targetLoad: z.string().nullable(),
  weightUnit: z.enum(["kg", "lb"]).nullable(),
  sortOrder: z.number().int().min(1),
});

export const exerciseCarouselPartDataSchema = z.object({
  sessionId: z.string().uuid(),
  sessionExerciseId: z.string().uuid(),
  originalExerciseName: z.string(),
  reason: z.string().nullable(),
  alternatives: z.array(exerciseAlternativeSchema).min(1),
  appliedAlternativeId: z.string().uuid().nullable().optional(),
});

export type ExerciseCarouselPartData = z.infer<
  typeof exerciseCarouselPartDataSchema
>;
