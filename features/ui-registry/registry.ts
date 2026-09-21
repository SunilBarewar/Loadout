import type { ComponentType } from "react";
import type { z } from "zod";
import { ChatText } from "./components/chat-text";
import { EquipmentPickerCard } from "./components/equipment-picker-card";
import { PlanUpdateCard } from "./components/plan-update-card";
import { WorkoutPlanCard } from "./components/workout-plan-card";
import { WeeklyScheduleGrid } from "./components/weekly-schedule-grid";
import { ExerciseCarouselCard } from "./components/exercise-carousel-card";
import { ProgressSnapshotCard } from "./components/progress-snapshot-card";
import { textPartDataSchema } from "./schemas/text";
import { equipmentPickerPartDataSchema } from "./schemas/equipment-picker";
import { planUpdatePartDataSchema } from "./schemas/plan-update";
import { workoutPlanPartDataSchema } from "./schemas/workout-plan";
import { weeklySchedulePartDataSchema } from "./schemas/weekly-schedule";
import { exerciseCarouselPartDataSchema } from "./schemas/exercise-carousel";
import { progressSnapshotPartDataSchema } from "./schemas/progress-snapshot";
import type { ChatPartType } from "./schemas/envelope";

type RegistryEntry = {
  schema: z.ZodType;
  component: ComponentType<{ data: unknown }>;
};

export const uiRegistry: Record<ChatPartType, RegistryEntry> = {
  text: {
    schema: textPartDataSchema,
    component: ChatText as ComponentType<{ data: unknown }>,
  },
  equipment_picker: {
    schema: equipmentPickerPartDataSchema,
    component: EquipmentPickerCard as ComponentType<{ data: unknown }>,
  },
  workout_plan: {
    schema: workoutPlanPartDataSchema,
    component: WorkoutPlanCard as ComponentType<{ data: unknown }>,
  },
  weekly_schedule: {
    schema: weeklySchedulePartDataSchema,
    component: WeeklyScheduleGrid as ComponentType<{ data: unknown }>,
  },
  plan_update: {
    schema: planUpdatePartDataSchema,
    component: PlanUpdateCard as ComponentType<{ data: unknown }>,
  },
  exercise_carousel: {
    schema: exerciseCarouselPartDataSchema,
    component: ExerciseCarouselCard as ComponentType<{ data: unknown }>,
  },
  progress_snapshot: {
    schema: progressSnapshotPartDataSchema,
    component: ProgressSnapshotCard as ComponentType<{ data: unknown }>,
  },
};
