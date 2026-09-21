import type { SessionExercise } from "@/db/schema";
import type { ExerciseCarouselPartData } from "../schemas/exercise-carousel";
import type { StoredChatPart } from "../schemas/envelope";

export type ExerciseCarouselSwapKey = `${string}:${string}`;

function normalizeExerciseName(name: string): string {
  return name.trim().toLowerCase();
}

export function findAppliedAlternativeId(
  data: ExerciseCarouselPartData,
  exercises: SessionExercise[]
): string | null {
  const replacement = exercises.find(
    (exercise) =>
      exercise.replacesSessionExerciseId === data.sessionExerciseId &&
      exercise.status !== "replaced"
  );

  if (!replacement) {
    return null;
  }

  const replacementName = normalizeExerciseName(replacement.nameSnapshot);
  const match = data.alternatives.find(
    (alternative) =>
      normalizeExerciseName(alternative.name) === replacementName
  );

  return match?.id ?? data.alternatives[0]?.id ?? null;
}

export function hydrateExerciseCarouselPart(
  part: Extract<StoredChatPart, { type: "exercise_carousel" }>,
  appliedAlternativeId: string | null | undefined
): Extract<StoredChatPart, { type: "exercise_carousel" }> {
  if (!appliedAlternativeId) {
    return part;
  }

  return {
    ...part,
    data: {
      ...part.data,
      appliedAlternativeId,
    },
  };
}
