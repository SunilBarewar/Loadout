import { z } from "zod";
import { weekdaySchema } from "@/features/plans/schemas";

export const weeklySchedulePartDataSchema = z.object({
  planId: z.uuid(),
  versionId: z.uuid(),
  schedulingMode: z.enum(["fixed_weekdays", "flexible_sequence"]),
  days: z.array(
    z.object({
      planDayId: z.uuid(),
      dayNumber: z.number().int().min(1),
      weekday: weekdaySchema.nullable(),
      title: z.string(),
      focus: z.string().nullable(),
      estimatedMinutes: z.number().int().nullable(),
    })
  ),
});

export type WeeklySchedulePartData = z.infer<typeof weeklySchedulePartDataSchema>;
