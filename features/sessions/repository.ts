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
  type SetStatus,
  type WeightUnit,
  type WorkoutPlan,
  type WorkoutSession,
} from "@/db";

const TERMINAL_SET_STATUSES: SetStatus[] = ["completed", "failed", "skipped"];
const ACTIVE_EXERCISE_STATUSES = ["pending", "in_progress"] as const;

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

export async function getSessionForUserToday(params: {
  userId: string;
  dayStart: Date;
  dayEnd: Date;
}): Promise<WorkoutSession | null> {
  const [activeOrPaused] = await db
    .select()
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, params.userId),
        inArray(workoutSessions.status, ["active", "paused"])
      )
    )
    .limit(1);

  if (activeOrPaused) {
    return activeOrPaused;
  }

  const [completedToday] = await db
    .select()
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, params.userId),
        eq(workoutSessions.status, "completed"),
        gte(workoutSessions.endedAt, params.dayStart),
        lte(workoutSessions.endedAt, params.dayEnd)
      )
    )
    .orderBy(desc(workoutSessions.endedAt))
    .limit(1);

  return completedToday ?? null;
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
  dayStart: Date;
  dayEnd: Date;
  todaysPlanDayId: string;
}): Promise<
  | { ok: true; sessionId: string; created: boolean }
  | { ok: false; error: string }
> {
  if (params.planDay.id !== params.todaysPlanDayId) {
    return {
      ok: false,
      error: "You can only start today's scheduled workout.",
    };
  }

  if (params.planDay.scheduledWeekday == null) {
    return {
      ok: false,
      error: "This workout day is missing a weekday assignment.",
    };
  }

  const sessionToday = await getSessionForUserToday({
    userId: params.userId,
    dayStart: params.dayStart,
    dayEnd: params.dayEnd,
  });

  if (sessionToday) {
    if (["active", "paused"].includes(sessionToday.status)) {
      return {
        ok: true,
        sessionId: sessionToday.id,
        created: false,
      };
    }

    return {
      ok: false,
      error: "You already completed a workout today.",
    };
  }

  const [session] = await db
    .insert(workoutSessions)
    .values({
      userId: params.userId,
      sourcePlanId: params.plan.id,
      sourcePlanVersionId: params.version.id,
      sourcePlanDayId: params.planDay.id,
      scheduledWeekdaySnapshot: params.planDay.scheduledWeekday,
      titleSnapshot: params.planDay.title,
      status: "active",
    })
    .returning({ id: workoutSessions.id });

  if (!session) {
    return { ok: false, error: "Could not start workout session." };
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

  return { ok: true, sessionId: session.id, created: true };
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
      notes: setLogs.notes,
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

async function countTerminalSetsForExercise(
  sessionExerciseId: string
): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(setLogs)
    .where(
      and(
        eq(setLogs.sessionExerciseId, sessionExerciseId),
        inArray(setLogs.status, TERMINAL_SET_STATUSES)
      )
    );

  return result?.count ?? 0;
}

async function countCompletedSetsForExercise(
  sessionExerciseId: string
): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(setLogs)
    .where(
      and(
        eq(setLogs.sessionExerciseId, sessionExerciseId),
        inArray(setLogs.status, ["completed", "failed"])
      )
    );

  return result?.count ?? 0;
}

async function getLoggedSetNumbers(
  sessionExerciseId: string
): Promise<Set<number>> {
  const rows = await db
    .select({ setNumber: setLogs.setNumber })
    .from(setLogs)
    .where(eq(setLogs.sessionExerciseId, sessionExerciseId));

  return new Set(rows.map((row) => row.setNumber));
}

async function advanceSessionAfterExerciseComplete(params: {
  sessionId: string;
  userId: string;
  exercise: SessionExercise;
  now: Date;
}): Promise<{ sessionCompleted: boolean; activeRestEndsAt: Date | null }> {
  const [nextExercise] = await db
    .select()
    .from(sessionExercises)
    .where(
      and(
        eq(sessionExercises.sessionId, params.sessionId),
        sql`${sessionExercises.position} > ${params.exercise.position}`,
        inArray(sessionExercises.status, [...ACTIVE_EXERCISE_STATUSES])
      )
    )
    .orderBy(asc(sessionExercises.position))
    .limit(1);

  let activeRestEndsAt: Date | null = null;

  if (nextExercise) {
    if (params.exercise.restSecondsSnapshot > 0) {
      activeRestEndsAt = new Date(
        params.now.getTime() + params.exercise.restSecondsSnapshot * 1000
      );
    }

    await db
      .update(workoutSessions)
      .set({
        currentExercisePosition: nextExercise.position,
        activeRestEndsAt,
        updatedAt: params.now,
      })
      .where(eq(workoutSessions.id, params.sessionId));
  } else {
    await endSession({
      sessionId: params.sessionId,
      userId: params.userId,
      mode: "complete",
    });
    return { sessionCompleted: true, activeRestEndsAt: null };
  }

  return { sessionCompleted: false, activeRestEndsAt };
}

async function markExerciseCompleted(params: {
  sessionId: string;
  userId: string;
  exercise: SessionExercise;
  now: Date;
}): Promise<{
  exerciseCompleted: boolean;
  sessionCompleted: boolean;
  activeRestEndsAt: Date | null;
}> {
  await db
    .update(sessionExercises)
    .set({ status: "completed", updatedAt: params.now })
    .where(eq(sessionExercises.id, params.exercise.id));

  const { sessionCompleted, activeRestEndsAt } =
    await advanceSessionAfterExerciseComplete({
      sessionId: params.sessionId,
      userId: params.userId,
      exercise: params.exercise,
      now: params.now,
    });

  return {
    exerciseCompleted: true,
    sessionCompleted,
    activeRestEndsAt,
  };
}

async function insertSkippedSetsForExercise(params: {
  exercise: SessionExercise;
  notes?: string | null;
  now: Date;
}): Promise<void> {
  const loggedSetNumbers = await getLoggedSetNumbers(params.exercise.id);
  const values = [];

  for (
    let setNumber = 1;
    setNumber <= params.exercise.targetSetsSnapshot;
    setNumber += 1
  ) {
    if (loggedSetNumbers.has(setNumber)) {
      continue;
    }

    values.push({
      sessionExerciseId: params.exercise.id,
      setNumber,
      plannedRepsMin: params.exercise.targetRepsMinSnapshot,
      plannedRepsMax: params.exercise.targetRepsMaxSnapshot,
      performedReps: null,
      performedLoad: null,
      weightUnit: params.exercise.weightUnitSnapshot,
      status: "skipped" as const,
      notes: params.notes ?? null,
      completedAt: params.now,
    });
  }

  if (values.length > 0) {
    await db.insert(setLogs).values(values);
  }
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

    const completedSetCount = await countCompletedSetsForExercise(exercise.id);
    const nextStatus =
      completedSetCount > 0 ? ("completed" as const) : ("skipped" as const);

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
  performedReps?: number | null;
  performedLoad?: string | null;
  rpe?: string | null;
  notes?: string | null;
  status?: SetStatus;
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
  if (!exercise || exercise.status === "replaced" || exercise.status === "skipped") {
    return null;
  }

  if (
    params.setNumber < 1 ||
    params.setNumber > exercise.targetSetsSnapshot
  ) {
    return null;
  }

  const setStatus = params.status ?? "completed";

  if (setStatus === "completed" && (params.performedReps ?? 0) < 1) {
    return null;
  }

  const now = new Date();
  const performedReps =
    setStatus === "skipped" ? null : (params.performedReps ?? null);
  const performedLoad =
    setStatus === "skipped"
      ? null
      : (params.performedLoad ?? exercise.targetLoadSnapshot);

  await db
    .insert(setLogs)
    .values({
      sessionExerciseId: params.sessionExerciseId,
      setNumber: params.setNumber,
      plannedRepsMin: exercise.targetRepsMinSnapshot,
      plannedRepsMax: exercise.targetRepsMaxSnapshot,
      performedReps,
      performedLoad,
      weightUnit: exercise.weightUnitSnapshot,
      rpe: params.rpe ?? null,
      status: setStatus,
      notes: params.notes ?? null,
      completedAt: now,
    })
    .onConflictDoUpdate({
      target: [setLogs.sessionExerciseId, setLogs.setNumber],
      set: {
        performedReps,
        performedLoad,
        weightUnit: exercise.weightUnitSnapshot,
        rpe: params.rpe ?? null,
        status: setStatus,
        notes: params.notes ?? null,
        completedAt: now,
        updatedAt: now,
      },
    });

  const terminalSetCount = await countTerminalSetsForExercise(
    params.sessionExerciseId
  );
  const exerciseCompleted =
    terminalSetCount >= exercise.targetSetsSnapshot;

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
    const advanceResult = await advanceSessionAfterExerciseComplete({
      sessionId: params.sessionId,
      userId: params.userId,
      exercise,
      now,
    });
    sessionCompleted = advanceResult.sessionCompleted;
    activeRestEndsAt = advanceResult.activeRestEndsAt;
  } else {
    const loggedSetNumbers = await getLoggedSetNumbers(params.sessionExerciseId);
    for (
      let candidate = params.setNumber + 1;
      candidate <= exercise.targetSetsSnapshot;
      candidate += 1
    ) {
      if (!loggedSetNumbers.has(candidate)) {
        nextSetNumber = candidate;
        break;
      }
    }

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

export async function finishExerciseEarly(params: {
  userId: string;
  sessionId: string;
  sessionExerciseId: string;
  notes?: string | null;
}): Promise<{
  exerciseCompleted: boolean;
  sessionCompleted: boolean;
  activeRestEndsAt: Date | null;
} | null> {
  const loaded = await getSessionWithExercises(params.sessionId, params.userId);
  if (!loaded || loaded.session.status !== "active") {
    return null;
  }

  const exercise = loaded.exercises.find(
    (item) => item.id === params.sessionExerciseId
  );
  if (
    !exercise ||
    exercise.status === "completed" ||
    exercise.status === "skipped" ||
    exercise.status === "replaced"
  ) {
    return null;
  }

  const now = new Date();

  await insertSkippedSetsForExercise({
    exercise,
    notes: params.notes,
    now,
  });

  if (params.notes) {
    await db
      .update(sessionExercises)
      .set({ notes: params.notes, updatedAt: now })
      .where(eq(sessionExercises.id, params.sessionExerciseId));
  }

  return markExerciseCompleted({
    sessionId: params.sessionId,
    userId: params.userId,
    exercise,
    now,
  });
}

export async function skipExercise(params: {
  userId: string;
  sessionId: string;
  sessionExerciseId: string;
  notes?: string | null;
}): Promise<{
  sessionCompleted: boolean;
  activeRestEndsAt: Date | null;
} | null> {
  const loaded = await getSessionWithExercises(params.sessionId, params.userId);
  if (!loaded || loaded.session.status !== "active") {
    return null;
  }

  const exercise = loaded.exercises.find(
    (item) => item.id === params.sessionExerciseId
  );
  if (
    !exercise ||
    exercise.status === "completed" ||
    exercise.status === "skipped" ||
    exercise.status === "replaced"
  ) {
    return null;
  }

  const now = new Date();

  await db
    .update(sessionExercises)
    .set({
      status: "skipped",
      notes: params.notes ?? null,
      updatedAt: now,
    })
    .where(eq(sessionExercises.id, params.sessionExerciseId));

  const { sessionCompleted, activeRestEndsAt } =
    await advanceSessionAfterExerciseComplete({
      sessionId: params.sessionId,
      userId: params.userId,
      exercise,
      now,
    });

  return { sessionCompleted, activeRestEndsAt };
}

export async function replaceExercise(params: {
  userId: string;
  sessionId: string;
  sessionExerciseId: string;
  name: string;
  reason?: string | null;
}): Promise<{ replacementExerciseId: string } | null> {
  const loaded = await getSessionWithExercises(params.sessionId, params.userId);
  if (!loaded || loaded.session.status !== "active") {
    return null;
  }

  const exercise = loaded.exercises.find(
    (item) => item.id === params.sessionExerciseId
  );
  if (
    !exercise ||
    exercise.status === "completed" ||
    exercise.status === "skipped" ||
    exercise.status === "replaced"
  ) {
    return null;
  }

  const trimmedName = params.name.trim();
  if (!trimmedName) {
    return null;
  }

  const now = new Date();
  const maxPosition = loaded.exercises.reduce(
    (max, item) => Math.max(max, item.position),
    0
  );

  await db
    .update(sessionExercises)
    .set({
      status: "replaced",
      replacementReason: params.reason ?? null,
      position: maxPosition + 1,
      updatedAt: now,
    })
    .where(eq(sessionExercises.id, params.sessionExerciseId));

  const [replacement] = await db
    .insert(sessionExercises)
    .values({
      sessionId: params.sessionId,
      position: exercise.position,
      nameSnapshot: trimmedName,
      primaryMuscleSnapshot: exercise.primaryMuscleSnapshot,
      equipmentSnapshot: exercise.equipmentSnapshot,
      targetSetsSnapshot: exercise.targetSetsSnapshot,
      targetRepsMinSnapshot: exercise.targetRepsMinSnapshot,
      targetRepsMaxSnapshot: exercise.targetRepsMaxSnapshot,
      targetLoadSnapshot: exercise.targetLoadSnapshot,
      weightUnitSnapshot: exercise.weightUnitSnapshot,
      restSecondsSnapshot: exercise.restSecondsSnapshot,
      status: "pending",
      replacesSessionExerciseId: params.sessionExerciseId,
    })
    .returning({ id: sessionExercises.id });

  if (!replacement) {
    return null;
  }

  await db
    .update(workoutSessions)
    .set({
      currentExercisePosition: exercise.position,
      updatedAt: now,
    })
    .where(eq(workoutSessions.id, params.sessionId));

  return { replacementExerciseId: replacement.id };
}

export async function setCurrentExercise(params: {
  userId: string;
  sessionId: string;
  position: number;
}): Promise<boolean> {
  const loaded = await getSessionWithExercises(params.sessionId, params.userId);
  if (
    !loaded ||
    !["active", "paused"].includes(loaded.session.status)
  ) {
    return false;
  }

  const exercise = loaded.exercises.find(
    (item) =>
      item.position === params.position && item.status !== "replaced"
  );
  if (!exercise) {
    return false;
  }

  await db
    .update(workoutSessions)
    .set({
      currentExercisePosition: params.position,
      updatedAt: new Date(),
    })
    .where(eq(workoutSessions.id, params.sessionId));

  return true;
}

export async function reorderSessionExercises(params: {
  userId: string;
  sessionId: string;
  orderedExerciseIds: string[];
}): Promise<boolean> {
  const loaded = await getSessionWithExercises(params.sessionId, params.userId);
  if (
    !loaded ||
    !["active", "paused"].includes(loaded.session.status)
  ) {
    return false;
  }

  const activeExercises = loaded.exercises.filter(
    (exercise) => exercise.status !== "replaced"
  );
  const activeIds = new Set(activeExercises.map((exercise) => exercise.id));

  if (
    params.orderedExerciseIds.length !== activeExercises.length ||
    !params.orderedExerciseIds.every((id) => activeIds.has(id))
  ) {
    return false;
  }

  const currentExercise = activeExercises.find(
    (exercise) =>
      exercise.position === loaded.session.currentExercisePosition
  );
  const now = new Date();

  // Two-phase update avoids unique (session_id, position) conflicts.
  // neon-http does not support transactions, so these run sequentially.
  for (const [index, exerciseId] of params.orderedExerciseIds.entries()) {
    await db
      .update(sessionExercises)
      .set({ position: 1000 + index + 1, updatedAt: now })
      .where(eq(sessionExercises.id, exerciseId));
  }

  for (const [index, exerciseId] of params.orderedExerciseIds.entries()) {
    await db
      .update(sessionExercises)
      .set({ position: index + 1, updatedAt: now })
      .where(eq(sessionExercises.id, exerciseId));
  }

  if (currentExercise) {
    const newPosition =
      params.orderedExerciseIds.indexOf(currentExercise.id) + 1;

    if (newPosition > 0) {
      await db
        .update(workoutSessions)
        .set({
          currentExercisePosition: newPosition,
          updatedAt: now,
        })
        .where(eq(workoutSessions.id, params.sessionId));
    }
  }

  return true;
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
