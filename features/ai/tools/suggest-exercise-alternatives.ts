import { tool } from "ai";
import { z } from "zod";
import type { StoredChatPart } from "@/features/ui-registry/schemas/envelope";
import type { PlanningContext } from "../planning-context";

const alternativeSchema = z.object({
  name: z.string().min(1).max(120),
  primaryMuscle: z.string().min(1).max(80),
  equipmentSlug: z.string().max(80).nullable().optional(),
  rationale: z.string().min(1).max(300),
});

const suggestExerciseAlternativesSchema = z.object({
  sessionExerciseId: z.string().uuid(),
  reason: z.string().max(300).optional(),
  alternatives: z.array(alternativeSchema).min(1).max(5),
});

export type SuggestExerciseAlternativesResult = {
  ok: true;
  uiPart: StoredChatPart;
};

export function createSuggestExerciseAlternativesTool(params: {
  planningContext: PlanningContext;
}) {
  const { sessionContext } = params.planningContext;

  return tool({
    description:
      "Suggest substitute exercises for the current live session exercise. Use sessionContext.currentExercise.sessionExerciseId — never invent IDs. Provide 2-4 alternatives that match the user's equipment and limitations.",
    inputSchema: suggestExerciseAlternativesSchema,
    execute: async ({
      sessionExerciseId,
      reason,
      alternatives,
    }): Promise<SuggestExerciseAlternativesResult> => {
      if (!sessionContext) {
        throw new Error("No active session context for exercise swap.");
      }

      const targetExercise =
        sessionContext.currentExercise?.sessionExerciseId === sessionExerciseId
          ? sessionContext.currentExercise
          : sessionContext.exercises.find(
              (exercise) => exercise.sessionExerciseId === sessionExerciseId
            );

      if (!targetExercise) {
        throw new Error("Session exercise not found in current session context.");
      }

      const uiPart: StoredChatPart = {
        id: crypto.randomUUID(),
        type: "exercise_carousel",
        schemaVersion: 1,
        data: {
          sessionId: sessionContext.sessionId,
          sessionExerciseId: targetExercise.sessionExerciseId,
          originalExerciseName: targetExercise.name,
          reason: reason ?? null,
          alternatives: alternatives.map((alternative, index) => ({
            id: crypto.randomUUID(),
            name: alternative.name,
            primaryMuscle: alternative.primaryMuscle,
            equipmentSlug: alternative.equipmentSlug ?? null,
            rationale: alternative.rationale,
            targetSets: targetExercise.targetSets,
            targetRepsMin: targetExercise.targetRepsMin,
            targetRepsMax: targetExercise.targetRepsMax,
            targetLoad: targetExercise.targetLoad,
            weightUnit: targetExercise.weightUnit,
            sortOrder: index + 1,
          })),
        },
      };

      return { ok: true, uiPart };
    },
  });
}
