import "server-only";

import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  lte,
  sql,
} from "drizzle-orm";
import {
  db,
  sessionExercises,
  setLogs,
  workoutSessions,
  type PlanDay,
  type PlanExercise,
  type PlanVersion,
  type SessionExercise,
  type WeightUnit,
  type WorkoutPlan,
  type WorkoutSession,
} from "@/db";

export async function getActiveSessionForUser(
  userId: string
): Promise<WorkoutSession | null> {
  const [session] = await db
    .select()
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, userId),
        inArray(workoutSessions.status, ["active", "paused"])
      )
    )
    .limit(1);

  return session ?? null;
}

export async function getSessionWithExercises(
  sessionId: string,
  userId: string
): Promise<{ session: WorkoutSession; exercises: SessionExercise[] } | null> {
  const [session] = await db
    .select()
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.id, sessionId),
        eq(workoutSessions.userId, userId)
      )
    )
    .limit(1);

  if (!session) {
    return null;
  }

  const exercises = await db
    .select()
    .from(sessionExercises)
    .where(eq(sessionExercises.sessionId, session.id))
    .orderBy(asc(sessionExercises.position));

  return { session, exercises };
}

export async function getCompletedSessionForPlanDayToday(params: {
  userId: string;
  planDayId: string;
  dayStart: Date;
  dayEnd: Date;
}): Promise<WorkoutSession | null> {
  const [session] = await db
    .select()
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, params.userId),
        eq(workoutSessions.sourcePlanDayId, params.planDayId),
        eq(workoutSessions.status, "completed"),
        gte(workoutSessions.endedAt, params.dayStart),
        lte(workoutSessions.endedAt, params.dayEnd)
      )
    )
    .orderBy(desc(workoutSessions.endedAt))
    .limit(1);

  return session ?? null;
}

export async function getLastCompletedSessionForPlanInRange(params: {
  userId: string;
  planId: string;
  rangeStart: Date;
  rangeEnd: Date;
}): Promise<WorkoutSession | null> {
  const [session] = await db
    .select()
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, params.userId),
        eq(workoutSessions.sourcePlanId, params.planId),
        eq(workoutSessions.status, "completed"),
        gte(workoutSessions.endedAt, params.rangeStart),
        lte(workoutSessions.endedAt, params.rangeEnd)
      )
    )
    .orderBy(desc(workoutSessions.endedAt))
    .limit(1);

  return session ?? null;
}

export async function getCompletedSessionsForWeek(params: {
  userId: string;
  planId?: string;
  weekStart: Date;
  weekEnd: Date;
}): Promise<WorkoutSession[]> {
  const conditions = [
    eq(workoutSessions.userId, params.userId),
    eq(workoutSessions.status, "completed"),
    gte(workoutSessions.endedAt, params.weekStart),
    lte(workoutSessions.endedAt, params.weekEnd),
  ];

  if (params.planId) {
    conditions.push(eq(workoutSessions.sourcePlanId, params.planId));
  }

  return db
    .select()
    .from(workoutSessions)
    .where(and(...conditions))
    .orderBy(desc(workoutSessions.endedAt));
}

export async function getWeeklyVolume(params: {
  userId: string;
  weekStart: Date;
  weekEnd: Date;
}): Promise<number> {
  const [result] = await db
    .select({
      totalVolume: sql<string>`COALESCE(SUM(
        CAST(${setLogs.performedLoad} AS numeric) * ${setLogs.performedReps}
      ), 0)`,
    })
    .from(setLogs)
    .innerJoin(
      sessionExercises,
      eq(setLogs.sessionExerciseId, sessionExercises.id)
    )
    .innerJoin(
      workoutSessions,
      eq(sessionExercises.sessionId, workoutSessions.id)
    )
    .where(
      and(
        eq(workoutSessions.userId, params.userId),
        eq(workoutSessions.status, "completed"),
        gte(workoutSessions.endedAt, params.weekStart),
        lte(workoutSessions.endedAt, params.weekEnd),
        eq(setLogs.status, "completed")
      )
    );

  return Number(result?.totalVolume ?? 0);
}

export async function startSessionFromPlanDay(params: {
  userId: string;
  plan: WorkoutPlan;
  version: PlanVersion;
  planDay: PlanDay & { exercises: PlanExercise[] };
  weightUnit: WeightUnit;
}): Promise<{ sessionId: string; created: boolean }> {
  const existing = await getActiveSessionForUser(params.userId);
  if (existing) {
    return { sessionId: existing.id, created: false };
  }

  const [session] = await db
    .insert(workoutSessions)
    .values({
      userId: params.userId,
      sourcePlanId: params.plan.id,
      sourcePlanVersionId: params.version.id,
      sourcePlanDayId: params.planDay.id,
      titleSnapshot: params.planDay.title,
      status: "active",
    })
    .returning({ id: workoutSessions.id });

  if (!session) {
    throw new Error("Could not start workout session.");
  }

  const orderedExercises = [...params.planDay.exercises].sort(
    (a, b) => a.position - b.position
  );

  if (orderedExercises.length > 0) {
    await db.insert(sessionExercises).values(
      orderedExercises.map((exercise) => ({
        sessionId: session.id,
        sourcePlanExerciseId: exercise.id,
        position: exercise.position,
        nameSnapshot: exercise.name,
        primaryMuscleSnapshot: exercise.primaryMuscleGroup,
        equipmentSnapshot: exercise.equipmentSlug,
        targetSetsSnapshot: exercise.targetSets,
        targetRepsMinSnapshot: exercise.targetRepsMin,
        targetRepsMaxSnapshot: exercise.targetRepsMax,
        targetLoadSnapshot: exercise.targetLoad,
        weightUnitSnapshot: exercise.weightUnit ?? params.weightUnit,
        restSecondsSnapshot: exercise.restSeconds,
        status: "pending" as const,
      }))
    );
  }

  return { sessionId: session.id, created: true };
}

export async function getSessionById(
  sessionId: string,
  userId: string
): Promise<WorkoutSession | null> {
  const [session] = await db
    .select()
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.id, sessionId),
        eq(workoutSessions.userId, userId)
      )
    )
    .limit(1);

  return session ?? null;
}
