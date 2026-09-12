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

export async function getSetLogsForSession(
  sessionId: string,
  userId: string
) {
  return db
    .select({
      id: setLogs.id,
      sessionExerciseId: setLogs.sessionExerciseId,
      setNumber: setLogs.setNumber,
      performedReps: setLogs.performedReps,
      performedLoad: setLogs.performedLoad,
      weightUnit: setLogs.weightUnit,
      status: setLogs.status,
      completedAt: setLogs.completedAt,
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
        eq(workoutSessions.id, sessionId),
        eq(workoutSessions.userId, userId)
      )
    )
    .orderBy(asc(sessionExercises.position), asc(setLogs.setNumber));
}

async function countSetLogsForExercise(
  sessionExerciseId: string
): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(setLogs)
    .where(eq(setLogs.sessionExerciseId, sessionExerciseId));

  return result?.count ?? 0;
}

async function finalizeSessionExercises(sessionId: string): Promise<void> {
  const exercises = await db
    .select()
    .from(sessionExercises)
    .where(eq(sessionExercises.sessionId, sessionId));

  for (const exercise of exercises) {
    if (
      exercise.status === "completed" ||
      exercise.status === "skipped" ||
      exercise.status === "replaced"
    ) {
      continue;
    }

    const loggedSetCount = await countSetLogsForExercise(exercise.id);
    const nextStatus =
      loggedSetCount > 0 ? ("completed" as const) : ("skipped" as const);

    await db
      .update(sessionExercises)
      .set({ status: nextStatus, updatedAt: new Date() })
      .where(eq(sessionExercises.id, exercise.id));
  }
}

export async function pauseSession(
  sessionId: string,
  userId: string
): Promise<WorkoutSession | null> {
  const session = await getSessionById(sessionId, userId);
  if (!session || session.status !== "active") {
    return null;
  }

  const [updated] = await db
    .update(workoutSessions)
    .set({ status: "paused", updatedAt: new Date() })
    .where(eq(workoutSessions.id, sessionId))
    .returning();

  return updated ?? null;
}

export async function resumeSession(
  sessionId: string,
  userId: string
): Promise<WorkoutSession | null> {
  const session = await getSessionById(sessionId, userId);
  if (!session || session.status !== "paused") {
    return null;
  }

  const [updated] = await db
    .update(workoutSessions)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(workoutSessions.id, sessionId))
    .returning();

  return updated ?? null;
}

export async function endSession(params: {
  sessionId: string;
  userId: string;
  mode: "complete" | "abandon";
  notes?: string;
  perceivedEffort?: string;
}): Promise<WorkoutSession | null> {
  const session = await getSessionById(params.sessionId, params.userId);
  if (!session || !["active", "paused"].includes(session.status)) {
    return null;
  }

  await finalizeSessionExercises(params.sessionId);

  const [updated] = await db
    .update(workoutSessions)
    .set({
      status: params.mode === "complete" ? "completed" : "abandoned",
      endedAt: new Date(),
      activeRestEndsAt: null,
      notes: params.notes ?? session.notes,
      perceivedEffort: params.perceivedEffort ?? session.perceivedEffort,
      updatedAt: new Date(),
    })
    .where(eq(workoutSessions.id, params.sessionId))
    .returning();

  return updated ?? null;
}

export async function logSet(params: {
  userId: string;
  sessionId: string;
  sessionExerciseId: string;
  setNumber: number;
  performedReps: number;
  performedLoad?: string | null;
  rpe?: string | null;
  status?: "completed" | "failed" | "skipped";
}): Promise<{
  exerciseCompleted: boolean;
  sessionCompleted: boolean;
  nextSetNumber: number | null;
  activeRestEndsAt: Date | null;
} | null> {
  const loaded = await getSessionWithExercises(params.sessionId, params.userId);
  if (!loaded || loaded.session.status !== "active") {
    return null;
  }

  const exercise = loaded.exercises.find(
    (item) => item.id === params.sessionExerciseId
  );
  if (!exercise) {
    return null;
  }

  if (
    params.setNumber < 1 ||
    params.setNumber > exercise.targetSetsSnapshot ||
    params.performedReps < 1
  ) {
    return null;
  }

  const now = new Date();
  const setStatus = params.status ?? "completed";

  await db
    .insert(setLogs)
    .values({
      sessionExerciseId: params.sessionExerciseId,
      setNumber: params.setNumber,
      plannedRepsMin: exercise.targetRepsMinSnapshot,
      plannedRepsMax: exercise.targetRepsMaxSnapshot,
      performedReps: params.performedReps,
      performedLoad: params.performedLoad ?? exercise.targetLoadSnapshot,
      weightUnit: exercise.weightUnitSnapshot,
      rpe: params.rpe ?? null,
      status: setStatus,
      completedAt: now,
    })
    .onConflictDoUpdate({
      target: [setLogs.sessionExerciseId, setLogs.setNumber],
      set: {
        performedReps: params.performedReps,
        performedLoad: params.performedLoad ?? exercise.targetLoadSnapshot,
        weightUnit: exercise.weightUnitSnapshot,
        rpe: params.rpe ?? null,
        status: setStatus,
        completedAt: now,
        updatedAt: now,
      },
    });

  const loggedSetCount = await countSetLogsForExercise(params.sessionExerciseId);
  const exerciseCompleted = loggedSetCount >= exercise.targetSetsSnapshot;

  if (exercise.status !== "completed") {
    await db
      .update(sessionExercises)
      .set({
        status: exerciseCompleted ? "completed" : "in_progress",
        updatedAt: now,
      })
      .where(eq(sessionExercises.id, params.sessionExerciseId));
  }

  let activeRestEndsAt: Date | null = null;
  let sessionCompleted = false;
  let nextSetNumber: number | null = null;

  if (exerciseCompleted) {
    const [nextExercise] = await db
      .select()
      .from(sessionExercises)
      .where(
        and(
          eq(sessionExercises.sessionId, params.sessionId),
          sql`${sessionExercises.position} > ${exercise.position}`,
          inArray(sessionExercises.status, ["pending", "in_progress"])
        )
      )
      .orderBy(asc(sessionExercises.position))
      .limit(1);

    if (nextExercise) {
      await db
        .update(workoutSessions)
        .set({
          currentExercisePosition: nextExercise.position,
          activeRestEndsAt:
            exercise.restSecondsSnapshot > 0
              ? new Date(now.getTime() + exercise.restSecondsSnapshot * 1000)
              : null,
          updatedAt: now,
        })
        .where(eq(workoutSessions.id, params.sessionId));

      if (exercise.restSecondsSnapshot > 0) {
        activeRestEndsAt = new Date(
          now.getTime() + exercise.restSecondsSnapshot * 1000
        );
      }
    } else {
      await endSession({
        sessionId: params.sessionId,
        userId: params.userId,
        mode: "complete",
      });
      sessionCompleted = true;
    }
  } else {
    nextSetNumber = params.setNumber + 1;
    if (exercise.restSecondsSnapshot > 0) {
      activeRestEndsAt = new Date(
        now.getTime() + exercise.restSecondsSnapshot * 1000
      );
    }

    await db
      .update(workoutSessions)
      .set({
        activeRestEndsAt,
        updatedAt: now,
      })
      .where(eq(workoutSessions.id, params.sessionId));
  }

  return {
    exerciseCompleted,
    sessionCompleted,
    nextSetNumber: exerciseCompleted ? null : nextSetNumber,
    activeRestEndsAt,
  };
}

export async function getSessionHistoryPage(params: {
  userId: string;
  page: number;
  pageSize: number;
}): Promise<{
  items: Array<{
    id: string;
    titleSnapshot: string;
    status: "completed" | "abandoned";
    startedAt: Date;
    endedAt: Date | null;
    setCount: number;
  }>;
  totalItems: number;
}> {
  const page = Math.max(1, params.page);
  const pageSize = Math.max(1, Math.min(params.pageSize, 50));
  const offset = (page - 1) * pageSize;

  const historyCondition = and(
    eq(workoutSessions.userId, params.userId),
    inArray(workoutSessions.status, ["completed", "abandoned"])
  );

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(workoutSessions)
    .where(historyCondition);

  const sessions = await db
    .select({
      id: workoutSessions.id,
      titleSnapshot: workoutSessions.titleSnapshot,
      status: workoutSessions.status,
      startedAt: workoutSessions.startedAt,
      endedAt: workoutSessions.endedAt,
    })
    .from(workoutSessions)
    .where(historyCondition)
    .orderBy(desc(workoutSessions.endedAt))
    .limit(pageSize)
    .offset(offset);

  const sessionIds = sessions.map((session) => session.id);
  const setCountBySessionId = new Map<string, number>();

  if (sessionIds.length > 0) {
    const setCounts = await db
      .select({
        sessionId: sessionExercises.sessionId,
        setCount: sql<number>`count(${setLogs.id})::int`,
      })
      .from(setLogs)
      .innerJoin(
        sessionExercises,
        eq(setLogs.sessionExerciseId, sessionExercises.id)
      )
      .where(inArray(sessionExercises.sessionId, sessionIds))
      .groupBy(sessionExercises.sessionId);

    for (const row of setCounts) {
      setCountBySessionId.set(row.sessionId, row.setCount);
    }
  }

  return {
    items: sessions.map((session) => ({
      id: session.id,
      titleSnapshot: session.titleSnapshot,
      status: session.status as "completed" | "abandoned",
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      setCount: setCountBySessionId.get(session.id) ?? 0,
    })),
    totalItems: countResult?.count ?? 0,
  };
}
