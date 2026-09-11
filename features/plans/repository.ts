import "server-only";

import { and, asc, desc, eq, inArray } from "drizzle-orm";
import {
  db,
  equipment,
  planDays,
  planExercises,
  planVersions,
  workoutPlans,
  type PlanDay,
  type PlanExercise,
  type PlanVersion,
  type WeightUnit,
  type WorkoutPlan,
} from "@/db";
import type {
  InsertedDraftPlan,
  ProposeWorkoutPlanInput,
} from "./schemas";

export class PlanCompilerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanCompilerError";
  }
}

function remapEquipmentSlug(
  slug: string | null,
  availableSlugs: string[],
  catalogSlugs: Set<string>
): string | null {
  if (!slug) {
    return null;
  }

  if (availableSlugs.includes(slug) && catalogSlugs.has(slug)) {
    return slug;
  }

  if (availableSlugs.includes("bodyweight") && catalogSlugs.has("bodyweight")) {
    return "bodyweight";
  }

  const firstAvailable = availableSlugs.find((item) => catalogSlugs.has(item));
  return firstAvailable ?? null;
}

function toWeekday(
  value: number | null
): InsertedDraftPlan["days"][number]["weekday"] {
  if (
    value === 0 ||
    value === 1 ||
    value === 2 ||
    value === 3 ||
    value === 4 ||
    value === 5 ||
    value === 6
  ) {
    return value;
  }

  return null;
}

function formTipsToText(tips: string[]): string | null {
  const cleaned = tips.map((tip) => tip.trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned.join("\n") : null;
}

export async function insertDraftPlan(params: {
  userId: string;
  domain: ProposeWorkoutPlanInput;
  availableEquipmentSlugs: string[];
  weightUnit: WeightUnit;
}): Promise<InsertedDraftPlan> {
  const catalog = await db.select({ slug: equipment.slug }).from(equipment);
  const catalogSlugs = new Set(catalog.map((item) => item.slug));

  const orderedDays = [...params.domain.days].sort(
    (a, b) => a.dayNumber - b.dayNumber
  );

  let planId: string | null = null;

  try {
    const [plan] = await db
      .insert(workoutPlans)
      .values({
        userId: params.userId,
        title: params.domain.title,
        status: "draft",
        goal: params.domain.goal,
        daysPerWeek: params.domain.daysPerWeek,
      })
      .returning({ id: workoutPlans.id });

    if (!plan) {
      throw new PlanCompilerError("Could not create the draft plan.");
    }

    planId = plan.id;

    const [version] = await db
      .insert(planVersions)
      .values({
        planId: plan.id,
        versionNumber: 1,
        changeSummary: "Initial draft",
      })
      .returning({ id: planVersions.id });

    if (!version) {
      throw new PlanCompilerError("Could not create the plan version.");
    }

    const insertedDays = await db
      .insert(planDays)
      .values(
        orderedDays.map((day) => ({
          planVersionId: version.id,
          dayNumber: day.dayNumber,
          scheduledWeekday: day.weekday,
          title: day.title,
          focus: day.focus,
          estimatedMinutes: day.estimatedMinutes,
          instructions: day.instructions,
          sortOrder: day.dayNumber,
        }))
      )
      .returning({
        id: planDays.id,
        dayNumber: planDays.dayNumber,
        scheduledWeekday: planDays.scheduledWeekday,
        title: planDays.title,
        focus: planDays.focus,
        estimatedMinutes: planDays.estimatedMinutes,
      });

    const dayIdByNumber = new Map(
      insertedDays.map((day) => [day.dayNumber, day.id])
    );

    const exerciseRows = orderedDays.flatMap((day) => {
      const planDayId = dayIdByNumber.get(day.dayNumber);
      if (!planDayId) {
        throw new PlanCompilerError("Could not map inserted plan days.");
      }

      return [...day.exercises]
        .sort((a, b) => a.position - b.position)
        .map((exercise) => ({
          planDayId,
          position: exercise.position,
          name: exercise.name,
          primaryMuscleGroup: exercise.primaryMuscleGroup,
          equipmentSlug: remapEquipmentSlug(
            exercise.equipmentSlug,
            params.availableEquipmentSlugs,
            catalogSlugs
          ),
          targetSets: exercise.targetSets,
          targetRepsMin: exercise.targetRepsMin,
          targetRepsMax: exercise.targetRepsMax,
          targetLoad:
            exercise.targetLoad == null ? null : String(exercise.targetLoad),
          weightUnit:
            exercise.targetLoad == null ? null : params.weightUnit,
          restSeconds: exercise.restSeconds,
          targetRpe:
            exercise.targetRpe == null ? null : String(exercise.targetRpe),
          formTips: formTipsToText(exercise.formTips),
          notes: exercise.notes,
        }));
    });

    if (exerciseRows.length === 0) {
      throw new PlanCompilerError("A plan must include at least one exercise.");
    }

    await db.insert(planExercises).values(exerciseRows);

    const estimatedWeeklyMinutes = orderedDays.reduce(
      (total, day) => total + day.estimatedMinutes,
      0
    );

    return {
      planId: plan.id,
      versionId: version.id,
      state: "draft",
      title: params.domain.title,
      goal: params.domain.goal,
      daysPerWeek: params.domain.daysPerWeek,
      summary: params.domain.summary,
      estimatedWeeklyMinutes,
      schedulingMode: params.domain.schedulingMode,
      days: insertedDays
        .sort((a, b) => a.dayNumber - b.dayNumber)
        .map((day) => ({
          planDayId: day.id,
          dayNumber: day.dayNumber,
          weekday: toWeekday(day.scheduledWeekday),
          title: day.title,
          focus: day.focus,
          estimatedMinutes: day.estimatedMinutes,
        })),
    };
  } catch (error) {
    if (planId) {
      try {
        await db.delete(workoutPlans).where(eq(workoutPlans.id, planId));
      } catch {
        // Neon HTTP has no transactions; best-effort rollback.
      }
    }

    if (error instanceof PlanCompilerError) {
      throw error;
    }

    throw new PlanCompilerError(
      "Could not save this draft plan. Ask me to try again with a simpler program."
    );
  }
}

export type PlanWithVersion = {
  plan: WorkoutPlan;
  version: PlanVersion;
  days: Array<PlanDay & { exercises: PlanExercise[] }>;
};

export async function getPlanWithVersion(
  planId: string,
  userId: string,
  versionId?: string
): Promise<PlanWithVersion | null> {
  const [plan] = await db
    .select()
    .from(workoutPlans)
    .where(and(eq(workoutPlans.id, planId), eq(workoutPlans.userId, userId)))
    .limit(1);

  if (!plan) {
    return null;
  }

  const version = versionId
    ? (
        await db
          .select()
          .from(planVersions)
          .where(
            and(
              eq(planVersions.id, versionId),
              eq(planVersions.planId, plan.id)
            )
          )
          .limit(1)
      )[0]
    : plan.activeVersionId
      ? (
          await db
            .select()
            .from(planVersions)
            .where(eq(planVersions.id, plan.activeVersionId))
            .limit(1)
        )[0]
      : (
          await db
            .select()
            .from(planVersions)
            .where(eq(planVersions.planId, plan.id))
            .orderBy(desc(planVersions.versionNumber))
            .limit(1)
        )[0];

  if (!version) {
    return null;
  }

  const days = await db
    .select()
    .from(planDays)
    .where(eq(planDays.planVersionId, version.id))
    .orderBy(asc(planDays.sortOrder), asc(planDays.dayNumber));

  const dayIds = days.map((day) => day.id);
  const exercisesByDay = new Map<string, PlanExercise[]>();

  if (dayIds.length > 0) {
    const dayExercises = await db
      .select()
      .from(planExercises)
      .where(inArray(planExercises.planDayId, dayIds))
      .orderBy(asc(planExercises.position));

    for (const exercise of dayExercises) {
      const list = exercisesByDay.get(exercise.planDayId) ?? [];
      list.push(exercise);
      exercisesByDay.set(exercise.planDayId, list);
    }
  }

  return {
    plan,
    version,
    days: days.map((day) => ({
      ...day,
      exercises: exercisesByDay.get(day.id) ?? [],
    })),
  };
}
