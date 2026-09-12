import type { PlanExercise, WeightUnit } from "@/db";
import type { TodayExercisePreview } from "@/features/sessions/schemas";

export function formatOrderLabel(position: number): string {
  return position.toString().padStart(2, "0");
}

export function formatTargetLabel(exercise: PlanExercise): string {
  const reps =
    exercise.targetRepsMin === exercise.targetRepsMax
      ? `${exercise.targetRepsMin}`
      : `${exercise.targetRepsMin}–${exercise.targetRepsMax}`;

  return `${exercise.targetSets} sets × ${reps} reps`;
}

export function formatLoadLabel(
  exercise: PlanExercise,
  fallbackUnit: WeightUnit
): string | null {
  if (exercise.targetLoad == null) {
    return null;
  }

  const unit = exercise.weightUnit ?? fallbackUnit;
  return `${exercise.targetLoad} ${unit} target`;
}

export function formatRestLabel(restSeconds: number): string {
  return `${restSeconds}s rest`;
}

export function formatEquipmentLabel(slugs: Array<string | null>): string | null {
  const unique = [
    ...new Set(
      slugs
        .filter((slug): slug is string => Boolean(slug))
        .map((slug) =>
          slug
            .split("-")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ")
        )
    ),
  ];

  if (unique.length === 0) {
    return null;
  }

  return unique.join(", ");
}

export function mapExercisesToPreviews(
  exercises: PlanExercise[],
  weightUnit: WeightUnit
): TodayExercisePreview[] {
  return [...exercises]
    .sort((a, b) => a.position - b.position)
    .map((exercise) => ({
      position: exercise.position,
      orderLabel: formatOrderLabel(exercise.position),
      name: exercise.name,
      targetLabel: formatTargetLabel(exercise),
      loadLabel: formatLoadLabel(exercise, weightUnit),
      restLabel: formatRestLabel(exercise.restSeconds),
    }));
}

export function formatGoalLabel(
  goal: string | null | undefined
): string | null {
  if (!goal) {
    return null;
  }

  return goal
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatVolume(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}
