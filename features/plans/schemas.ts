import { z } from "zod";
import { WEEKDAY_FIELD_DESCRIPTION } from "./weekdays";

export const trainingGoalSchema = z.enum([
  "hypertrophy",
  "strength",
  "fat_loss",
  "endurance",
  "general_fitness",
]);

export const schedulingModeSchema = z.enum([
  "fixed_weekdays",
  "flexible_sequence",
]);

export const weekdaySchema = z
  .union([
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
  ])
  .describe(WEEKDAY_FIELD_DESCRIPTION);

export const proposePlanExerciseSchema = z.object({
  position: z.number().int().min(1),
  name: z.string().min(1).max(120),
  primaryMuscleGroup: z.string().min(1).max(80),
  equipmentSlug: z.string().min(1).nullable(),
  targetSets: z.number().int().min(1).max(20),
  targetRepsMin: z.number().int().min(1).max(100),
  targetRepsMax: z.number().int().min(1).max(100),
  targetLoad: z.number().nonnegative().nullable(),
  restSeconds: z.number().int().min(0).max(1800),
  targetRpe: z.number().min(1).max(10).nullable(),
  formTips: z.array(z.string().min(1)).max(8),
  notes: z.string().max(500).nullable(),
});

export const proposePlanDaySchema = z.object({
  dayNumber: z.number().int().min(1).max(7),
  weekday: weekdaySchema
    .nullable()
    .describe(
      `Required when schedulingMode is fixed_weekdays. ${WEEKDAY_FIELD_DESCRIPTION}`
    ),
  title: z.string().min(1).max(80),
  focus: z.string().max(120).nullable(),
  estimatedMinutes: z.number().int().min(10).max(240),
  instructions: z.string().max(1000).nullable(),
  exercises: z.array(proposePlanExerciseSchema).min(1).max(16),
});

export const proposeWorkoutPlanSchema = z
  .object({
    title: z.string().min(1).max(80),
    goal: trainingGoalSchema,
    daysPerWeek: z.number().int().min(1).max(7),
    schedulingMode: schedulingModeSchema,
    summary: z.string().min(1).max(600),
    days: z.array(proposePlanDaySchema).min(1).max(7),
  })
  .superRefine((value, ctx) => {
    if (value.days.length !== value.daysPerWeek) {
      ctx.addIssue({
        code: "custom",
        path: ["days"],
        message: `days length must equal daysPerWeek (${value.daysPerWeek})`,
      });
    }

    const dayNumbers = value.days.map((day) => day.dayNumber);
    const uniqueDayNumbers = new Set(dayNumbers);
    if (uniqueDayNumbers.size !== dayNumbers.length) {
      ctx.addIssue({
        code: "custom",
        path: ["days"],
        message: "dayNumber values must be unique",
      });
    }

    for (const [dayIndex, day] of value.days.entries()) {
      if (
        value.schedulingMode === "fixed_weekdays" &&
        day.weekday == null
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["days", dayIndex, "weekday"],
          message: "weekday is required when schedulingMode is fixed_weekdays",
        });
      }

      const positions = day.exercises.map((exercise) => exercise.position);
      if (new Set(positions).size !== positions.length) {
        ctx.addIssue({
          code: "custom",
          path: ["days", dayIndex, "exercises"],
          message: "exercise position values must be unique within a day",
        });
      }

      for (const [exerciseIndex, exercise] of day.exercises.entries()) {
        if (exercise.targetRepsMax < exercise.targetRepsMin) {
          ctx.addIssue({
            code: "custom",
            path: ["days", dayIndex, "exercises", exerciseIndex, "targetRepsMax"],
            message: "targetRepsMax must be >= targetRepsMin",
          });
        }
      }
    }
  });

export type ProposeWorkoutPlanInput = z.infer<typeof proposeWorkoutPlanSchema>;
export type ProposePlanDay = z.infer<typeof proposePlanDaySchema>;
export type ProposePlanExercise = z.infer<typeof proposePlanExerciseSchema>;

export type InsertedDraftPlanDay = {
  planDayId: string;
  dayNumber: number;
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6 | null;
  title: string;
  focus: string | null;
  estimatedMinutes: number | null;
};

export type InsertedDraftPlan = {
  planId: string;
  versionId: string;
  state: "draft";
  title: string;
  goal: ProposeWorkoutPlanInput["goal"];
  daysPerWeek: number;
  summary: string;
  estimatedWeeklyMinutes: number;
  schedulingMode: ProposeWorkoutPlanInput["schedulingMode"];
  days: InsertedDraftPlanDay[];
};

export type ProposeWorkoutPlanResult =
  | ({ ok: true } & InsertedDraftPlan)
  | { ok: false; error: string };

export const reviseWorkoutPlanSchema = proposeWorkoutPlanSchema.extend({
  changeSummary: z.string().min(1).max(300),
});

export type ReviseWorkoutPlanInput = z.infer<typeof reviseWorkoutPlanSchema>;

export type PlanCardState = "draft" | "saved" | "active";

export type InsertedPlanRevision = Omit<InsertedDraftPlan, "state"> & {
  state: PlanCardState;
};

export type ReviseWorkoutPlanResult =
  | ({ ok: true } & InsertedPlanRevision)
  | { ok: false; error: string };
