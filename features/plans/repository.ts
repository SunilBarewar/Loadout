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
  InsertedPlanRevision,
  PlanCardState,
  ProposeWorkoutPlanInput,
  ReviseWorkoutPlanInput,
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

function planStatusToCardState(status: WorkoutPlan["status"]): PlanCardState {
  if (status === "active") return "active";
  if (status === "saved") return "saved";
  return "draft";
}

type InsertedVersionDays = {
  days: InsertedDraftPlan["days"];
  estimatedWeeklyMinutes: number;
};

async function insertVersionDaysAndExercises(params: {
  versionId: string;
  domain: ProposeWorkoutPlanInput;
  availableEquipmentSlugs: string[];
  weightUnit: WeightUnit;
  catalogSlugs: Set<string>;
}): Promise<InsertedVersionDays> {
  const orderedDays = [...params.domain.days].sort(
    (a, b) => a.dayNumber - b.dayNumber
  );

  const insertedDays = await db
    .insert(planDays)
    .values(
      orderedDays.map((day) => ({
        planVersionId: params.versionId,
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
          params.catalogSlugs
        ),
        targetSets: exercise.targetSets,
        targetRepsMin: exercise.targetRepsMin,
        targetRepsMax: exercise.targetRepsMax,
        targetLoad:
          exercise.targetLoad == null ? null : String(exercise.targetLoad),
        weightUnit: exercise.targetLoad == null ? null : params.weightUnit,
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
    estimatedWeeklyMinutes,
  };
}

export async function insertDraftPlan(params: {
  userId: string;
  domain: ProposeWorkoutPlanInput;
  availableEquipmentSlugs: string[];
  weightUnit: WeightUnit;
}): Promise<InsertedDraftPlan> {
  const catalog = await db.select({ slug: equipment.slug }).from(equipment);
  const catalogSlugs = new Set(catalog.map((item) => item.slug));

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

    const { days, estimatedWeeklyMinutes } = await insertVersionDaysAndExercises({
      versionId: version.id,
      domain: params.domain,
      availableEquipmentSlugs: params.availableEquipmentSlugs,
      weightUnit: params.weightUnit,
      catalogSlugs,
    });

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
      days,
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

async function verifyPlanVersion(
  planId: string,
  userId: string,
  versionId: string
): Promise<
  | { ok: true; plan: WorkoutPlan; version: PlanVersion }
  | { ok: false; error: string }
> {
  const [plan] = await db
    .select()
    .from(workoutPlans)
    .where(and(eq(workoutPlans.id, planId), eq(workoutPlans.userId, userId)))
    .limit(1);

  if (!plan) {
    return { ok: false, error: "Plan not found." };
  }

  if (plan.status === "archived") {
    return { ok: false, error: "This plan has been archived." };
  }

  const [version] = await db
    .select()
    .from(planVersions)
    .where(
      and(eq(planVersions.id, versionId), eq(planVersions.planId, plan.id))
    )
    .limit(1);

  if (!version) {
    return { ok: false, error: "Plan version not found." };
  }

  return { ok: true, plan, version };
}

export async function insertPlanRevision(params: {
  userId: string;
  planId: string;
  domain: ReviseWorkoutPlanInput;
  availableEquipmentSlugs: string[];
  weightUnit: WeightUnit;
}): Promise<InsertedPlanRevision> {
  const [plan] = await db
    .select()
    .from(workoutPlans)
    .where(
      and(eq(workoutPlans.id, params.planId), eq(workoutPlans.userId, params.userId))
    )
    .limit(1);

  if (!plan) {
    throw new PlanCompilerError("Plan not found.");
  }

  if (plan.status === "archived") {
    throw new PlanCompilerError("Cannot revise an archived plan.");
  }

  const catalog = await db.select({ slug: equipment.slug }).from(equipment);
  const catalogSlugs = new Set(catalog.map((item) => item.slug));

  const [latestVersion] = await db
    .select()
    .from(planVersions)
    .where(eq(planVersions.planId, plan.id))
    .orderBy(desc(planVersions.versionNumber))
    .limit(1);

  const nextVersionNumber = (latestVersion?.versionNumber ?? 0) + 1;

  const [version] = await db
    .insert(planVersions)
    .values({
      planId: plan.id,
      versionNumber: nextVersionNumber,
      changeSummary: params.domain.changeSummary,
    })
    .returning({ id: planVersions.id });

  if (!version) {
    throw new PlanCompilerError("Could not create the plan revision.");
  }

  const { days, estimatedWeeklyMinutes } = await insertVersionDaysAndExercises({
    versionId: version.id,
    domain: params.domain,
    availableEquipmentSlugs: params.availableEquipmentSlugs,
    weightUnit: params.weightUnit,
    catalogSlugs,
  });

  // Always point at the new version so plan views and cards stay in sync.
  // Saved/active plans revert to draft until the user saves the revision.
  const wasCommitted = plan.status === "saved" || plan.status === "active";

  await db
    .update(workoutPlans)
    .set({
      title: params.domain.title,
      goal: params.domain.goal,
      daysPerWeek: params.domain.daysPerWeek,
      activeVersionId: version.id,
      ...(wasCommitted ? { status: "draft" } : {}),
      updatedAt: new Date(),
    })
    .where(eq(workoutPlans.id, plan.id));

  return {
    planId: plan.id,
    versionId: version.id,
    state: wasCommitted ? "draft" : planStatusToCardState(plan.status),
    title: params.domain.title,
    goal: params.domain.goal,
    daysPerWeek: params.domain.daysPerWeek,
    summary: params.domain.summary,
    estimatedWeeklyMinutes,
    schedulingMode: params.domain.schedulingMode,
    days,
  };
}

export async function savePlanDraft(
  planId: string,
  userId: string,
  versionId: string
): Promise<{ ok: true; state: "saved" } | { ok: false; error: string }> {
  const verified = await verifyPlanVersion(planId, userId, versionId);
  if (!verified.ok) {
    return verified;
  }

  const { plan } = verified;

  if (plan.status === "active") {
    return { ok: false, error: "This plan is already active." };
  }

  await db
    .update(workoutPlans)
    .set({
      status: "saved",
      activeVersionId: versionId,
      updatedAt: new Date(),
    })
    .where(eq(workoutPlans.id, planId));

  return { ok: true, state: "saved" };
}

export async function activatePlan(
  planId: string,
  userId: string,
  versionId: string
): Promise<{ ok: true; state: "active" } | { ok: false; error: string }> {
  const verified = await verifyPlanVersion(planId, userId, versionId);
  if (!verified.ok) {
    return verified;
  }

  const activePlans = await db
    .select({ id: workoutPlans.id })
    .from(workoutPlans)
    .where(
      and(eq(workoutPlans.userId, userId), eq(workoutPlans.status, "active"))
    );

  for (const activePlan of activePlans) {
    if (activePlan.id === planId) {
      continue;
    }

    await db
      .update(workoutPlans)
      .set({ status: "saved", updatedAt: new Date() })
      .where(eq(workoutPlans.id, activePlan.id));
  }

  await db
    .update(workoutPlans)
    .set({
      status: "active",
      activeVersionId: versionId,
      updatedAt: new Date(),
    })
    .where(eq(workoutPlans.id, planId));

  return { ok: true, state: "active" };
}

export type PlanSummaryForContext = {
  planId: string;
  versionId: string;
  title: string;
  status: WorkoutPlan["status"];
  daysPerWeek: number;
  goal: WorkoutPlan["goal"];
};

export async function getPlanSummaryForContext(
  planId: string,
  userId: string
): Promise<PlanSummaryForContext | null> {
  const loaded = await getPlanWithVersion(planId, userId);
  if (!loaded) {
    return null;
  }

  return {
    planId: loaded.plan.id,
    versionId: loaded.version.id,
    title: loaded.plan.title,
    status: loaded.plan.status,
    daysPerWeek: loaded.plan.daysPerWeek,
    goal: loaded.plan.goal,
  };
}

export async function getPlanStatusesForUser(
  userId: string,
  planIds: string[]
): Promise<Map<string, PlanCardState>> {
  if (planIds.length === 0) {
    return new Map();
  }

  const uniqueIds = [...new Set(planIds)];
  const rows = await db
    .select({
      id: workoutPlans.id,
      status: workoutPlans.status,
    })
    .from(workoutPlans)
    .where(
      and(
        eq(workoutPlans.userId, userId),
        inArray(workoutPlans.id, uniqueIds)
      )
    );

  const result = new Map<string, PlanCardState>();
  for (const row of rows) {
    result.set(row.id, planStatusToCardState(row.status));
  }

  return result;
}
