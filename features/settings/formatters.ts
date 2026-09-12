import type { TrainingGoal, ExperienceLevel, WeightUnit } from "./schemas";

const goalLabels: Record<TrainingGoal, string> = {
  hypertrophy: "Hypertrophy",
  strength: "Strength",
  fat_loss: "Fat loss",
  endurance: "Endurance",
  general_fitness: "General fitness",
};

const experienceLabels: Record<ExperienceLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function formatGoalLabel(goal: TrainingGoal | null | undefined): string | null {
  if (!goal) {
    return null;
  }

  return goalLabels[goal];
}

export function formatExperienceLabel(
  level: ExperienceLevel | null | undefined
): string | null {
  if (!level) {
    return null;
  }

  return experienceLabels[level];
}

export function formatWeightUnitLabel(unit: WeightUnit): string {
  return unit === "kg" ? "Kilograms (kg)" : "Pounds (lb)";
}

export function formatEquipmentSummary(
  selectedNames: string[],
  customNotes: string | null | undefined
): string {
  if (selectedNames.length === 0) {
    return "No equipment selected yet.";
  }

  const base = selectedNames.join(", ");
  if (customNotes?.trim()) {
    return `${base}. Notes: ${customNotes.trim()}`;
  }

  return base;
}
