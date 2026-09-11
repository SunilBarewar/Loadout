import { z } from "zod";

const weekdaySchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);

export const weeklySchedulePartDataSchema = z.object({
  planId: z.string().uuid(),
  versionId: z.string().uuid(),
  schedulingMode: z.enum(["fixed_weekdays", "flexible_sequence"]),
  days: z.array(
    z.object({
      planDayId: z.string().uuid(),
      dayNumber: z.number().int().min(1),
      weekday: weekdaySchema.nullable(),
      title: z.string(),
      focus: z.string().nullable(),
      estimatedMinutes: z.number().int().nullable(),
    })
  ),
});

export type WeeklySchedulePartData = z.infer<typeof weeklySchedulePartDataSchema>;
