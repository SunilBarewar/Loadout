import { tool } from "ai";
import { z } from "zod";
import type { StoredChatPart } from "@/features/ui-registry/schemas/envelope";
import type { PlanningContext } from "../planning-context";

const showProgressSnapshotSchema = z.object({
  headline: z.string().min(1).max(120),
  insights: z.array(z.string().min(1).max(200)).min(1).max(4),
});

export type ShowProgressSnapshotResult = {
  ok: true;
  uiPart: StoredChatPart;
};

export function createShowProgressSnapshotTool(params: {
  planningContext: PlanningContext;
}) {
  const { trainingSummary } = params.planningContext;

  return tool({
    description:
      "Show a progress snapshot card when the user asks how they are doing, about adherence, volume, or strength trends. Requires logged workout history.",
    inputSchema: showProgressSnapshotSchema,
    execute: async ({
      headline,
      insights,
    }): Promise<ShowProgressSnapshotResult> => {
      if (!trainingSummary?.hasHistory) {
        throw new Error("No workout history available for progress snapshot.");
      }

      const uiPart: StoredChatPart = {
        id: crypto.randomUUID(),
        type: "progress_snapshot",
        schemaVersion: 1,
        data: {
          headline,
          insights,
          weeklySessionsCompleted: trainingSummary.weeklySessionsCompleted,
          weeklySessionsPlanned: trainingSummary.weeklySessionsPlanned,
          weeklyVolume: trainingSummary.weeklyVolume,
          previousWeeklyVolume: trainingSummary.previousWeeklyVolume,
          volumeChangePercent: trainingSummary.volumeChangePercent,
          volumeUnit: trainingSummary.volumeUnit,
          recentSessions: trainingSummary.recentSessions.map((session) => ({
            title: session.title,
            completedAt: session.completedAt,
            setCount: session.setCount,
          })),
          topLifts: trainingSummary.topLifts.slice(0, 5).map((lift) => ({
            exerciseName: lift.exerciseName,
            bestSetLabel:
              lift.load != null && lift.reps != null
                ? `${lift.load}${lift.weightUnit} × ${lift.reps}`
                : null,
            sessionDate: lift.sessionDate,
          })),
        },
      };

      return { ok: true, uiPart };
    },
  });
}
