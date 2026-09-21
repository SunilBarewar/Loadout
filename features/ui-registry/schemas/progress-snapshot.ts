import { z } from "zod";

export const progressSnapshotPartDataSchema = z.object({
  headline: z.string(),
  insights: z.array(z.string()).min(1),
  weeklySessionsCompleted: z.number().int().min(0),
  weeklySessionsPlanned: z.number().int().min(0).nullable(),
  weeklyVolume: z.number().min(0),
  previousWeeklyVolume: z.number().min(0),
  volumeChangePercent: z.number().nullable(),
  volumeUnit: z.enum(["kg", "lb"]),
  recentSessions: z.array(
    z.object({
      title: z.string(),
      completedAt: z.string(),
      setCount: z.number().int().min(0),
    })
  ),
  topLifts: z.array(
    z.object({
      exerciseName: z.string(),
      bestSetLabel: z.string().nullable(),
      sessionDate: z.string(),
    })
  ),
});

export type ProgressSnapshotPartData = z.infer<
  typeof progressSnapshotPartDataSchema
>;
