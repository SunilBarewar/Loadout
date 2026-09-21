import "server-only";

import {
  and,
  desc,
  eq,
  gte,
  inArray,
  lte,
  sql,
} from "drizzle-orm";
import {
  endOfWeek,
  startOfWeek,
  subWeeks,
} from "date-fns";
import {
  db,
  sessionExercises,
  setLogs,
  workoutSessions,
  type WeightUnit,
} from "@/db";
import { getActivePlanForUser } from "@/features/plans/repository";
import {
  getCompletedSessionsForWeek,
  getWeeklyVolume,
} from "@/features/sessions/repository";

export type RecentSessionSummary = {
  sessionId: string;
  title: string;
  completedAt: string;
  setCount: number;
  exerciseCount: number;
};

export type ExerciseBestSet = {
  exerciseName: string;
  load: number | null;
  reps: number | null;
  weightUnit: WeightUnit;
  sessionDate: string;
  estimatedVolume: number;
};

export type ProgressiveOverloadHint = {
  exerciseName: string;
  message: string;
};

export type TrainingSummaryForPrompt = {
  hasHistory: boolean;
  weeklySessionsCompleted: number;
  weeklySessionsPlanned: number | null;
  weeklyVolume: number;
  previousWeeklyVolume: number;
  volumeChangePercent: number | null;
  volumeUnit: WeightUnit;
  recentSessions: RecentSessionSummary[];
  topLifts: ExerciseBestSet[];
  progressiveOverloadHints: ProgressiveOverloadHint[];
};

export type SessionExerciseSnapshot = {
  sessionExerciseId: string;
  position: number;
  name: string;
  primaryMuscle: string;
  equipment: string | null;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  targetLoad: string | null;
  weightUnit: WeightUnit | null;
  status: string;
  completedSets: number;
};

export type SessionContextForPrompt = {
  sessionId: string;
  title: string;
  status: string;
  currentExercisePosition: number;
  currentExercise: SessionExerciseSnapshot | null;
  remainingExercises: Array<{ position: number; name: string; status: string }>;
  exercises: SessionExerciseSnapshot[];
};

function formatIsoDate(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

function setVolume(load: string | null, reps: number | null): number {
  if (!load || reps == null || reps < 1) return 0;
  return Number(load) * reps;
}

export async function getTrainingSummaryForUser(
  userId: string,
  weightUnit: WeightUnit
): Promise<TrainingSummaryForPrompt> {
  const referenceDate = new Date();
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 });
  const previousWeekStart = startOfWeek(subWeeks(referenceDate, 1), {
    weekStartsOn: 1,
  });
  const previousWeekEnd = endOfWeek(subWeeks(referenceDate, 1), {
    weekStartsOn: 1,
  });

  const activePlan = await getActivePlanForUser(userId);

  const [
    completedThisWeek,
    weeklyVolume,
    previousWeeklyVolume,
    recentSessions,
    bestSets,
  ] = await Promise.all([
    getCompletedSessionsForWeek({
      userId,
      planId: activePlan?.plan.id,
      weekStart,
      weekEnd,
    }),
    getWeeklyVolume({ userId, weekStart, weekEnd }),
    getWeeklyVolume({
      userId,
      weekStart: previousWeekStart,
      weekEnd: previousWeekEnd,
    }),
    getRecentSessionSummaries(userId, 5),
    getExerciseBestSets(userId, 8),
  ]);

  const volumeChangePercent =
    previousWeeklyVolume > 0
      ? ((weeklyVolume - previousWeeklyVolume) / previousWeeklyVolume) * 100
      : null;

  const progressiveOverloadHints = buildProgressiveOverloadHints(bestSets);

  return {
    hasHistory: recentSessions.length > 0,
    weeklySessionsCompleted: completedThisWeek.length,
    weeklySessionsPlanned: activePlan?.plan.daysPerWeek ?? null,
    weeklyVolume,
    previousWeeklyVolume,
    volumeChangePercent:
      volumeChangePercent != null
        ? Math.round(volumeChangePercent * 10) / 10
        : null,
    volumeUnit: weightUnit,
    recentSessions,
    topLifts: bestSets,
    progressiveOverloadHints,
  };
}

async function getRecentSessionSummaries(
  userId: string,
  limit: number
): Promise<RecentSessionSummary[]> {
  const sessions = await db
    .select({
      id: workoutSessions.id,
      titleSnapshot: workoutSessions.titleSnapshot,
      endedAt: workoutSessions.endedAt,
    })
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.status, "completed")
      )
    )
    .orderBy(desc(workoutSessions.endedAt))
    .limit(limit);

  if (sessions.length === 0) {
    return [];
  }

  const sessionIds = sessions.map((session) => session.id);

  const counts = await db
    .select({
      sessionId: sessionExercises.sessionId,
      setCount: sql<number>`count(${setLogs.id})::int`,
      exerciseCount: sql<number>`count(distinct ${sessionExercises.id})::int`,
    })
    .from(sessionExercises)
    .leftJoin(setLogs, eq(setLogs.sessionExerciseId, sessionExercises.id))
    .where(inArray(sessionExercises.sessionId, sessionIds))
    .groupBy(sessionExercises.sessionId);

  const countBySessionId = new Map(
    counts.map((row) => [
      row.sessionId,
      { setCount: row.setCount, exerciseCount: row.exerciseCount },
    ])
  );

  return sessions.map((session) => {
    const stats = countBySessionId.get(session.id);
    return {
      sessionId: session.id,
      title: session.titleSnapshot,
      completedAt: formatIsoDate(session.endedAt),
      setCount: stats?.setCount ?? 0,
      exerciseCount: stats?.exerciseCount ?? 0,
    };
  });
}

async function getExerciseBestSets(
  userId: string,
  limit: number
): Promise<ExerciseBestSet[]> {
  const rows = await db
    .select({
      exerciseName: sessionExercises.nameSnapshot,
      performedLoad: setLogs.performedLoad,
      performedReps: setLogs.performedReps,
      weightUnit: setLogs.weightUnit,
      endedAt: workoutSessions.endedAt,
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
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.status, "completed"),
        eq(setLogs.status, "completed")
      )
    )
    .orderBy(desc(workoutSessions.endedAt));

  const bestByExercise = new Map<string, ExerciseBestSet>();

  for (const row of rows) {
    const volume = setVolume(row.performedLoad, row.performedReps);
    const existing = bestByExercise.get(row.exerciseName);
    if (existing && existing.estimatedVolume >= volume) {
      continue;
    }

    bestByExercise.set(row.exerciseName, {
      exerciseName: row.exerciseName,
      load: row.performedLoad ? Number(row.performedLoad) : null,
      reps: row.performedReps,
      weightUnit: row.weightUnit ?? "lb",
      sessionDate: formatIsoDate(row.endedAt),
      estimatedVolume: volume,
    });
  }

  return [...bestByExercise.values()]
    .sort((a, b) => b.estimatedVolume - a.estimatedVolume)
    .slice(0, limit);
}

function buildProgressiveOverloadHints(
  bestSets: ExerciseBestSet[]
): ProgressiveOverloadHint[] {
  return bestSets.slice(0, 5).map((lift) => {
    if (lift.load != null && lift.reps != null) {
      const unit = lift.weightUnit;
      const suggestedLoad =
        Math.round((lift.load + (unit === "kg" ? 2.5 : 5)) * 10) / 10;
      return {
        exerciseName: lift.exerciseName,
        message: `Last best: ${lift.load}${unit} × ${lift.reps} (${lift.sessionDate}). Consider ${suggestedLoad}${unit} × ${lift.reps} next time.`,
      };
    }

    return {
      exerciseName: lift.exerciseName,
      message: `Recent best set logged on ${lift.sessionDate}. Add load or reps when all target sets feel solid.`,
    };
  });
}

export async function getSessionContextForCoach(
  sessionId: string,
  userId: string
): Promise<SessionContextForPrompt | null> {
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
    .where(eq(sessionExercises.sessionId, sessionId))
    .orderBy(sessionExercises.position);

  const activeExercises = exercises.filter(
    (exercise) => exercise.status !== "replaced"
  );

  const exerciseIds = activeExercises.map((exercise) => exercise.id);
  const completedSetCounts = new Map<string, number>();

  if (exerciseIds.length > 0) {
    const setCounts = await db
      .select({
        sessionExerciseId: setLogs.sessionExerciseId,
        count: sql<number>`count(*)::int`,
      })
      .from(setLogs)
      .where(
        and(
          inArray(setLogs.sessionExerciseId, exerciseIds),
          inArray(setLogs.status, ["completed", "failed"])
        )
      )
      .groupBy(setLogs.sessionExerciseId);

    for (const row of setCounts) {
      completedSetCounts.set(row.sessionExerciseId, row.count);
    }
  }

  const snapshots: SessionExerciseSnapshot[] = activeExercises.map(
    (exercise) => ({
      sessionExerciseId: exercise.id,
      position: exercise.position,
      name: exercise.nameSnapshot,
      primaryMuscle: exercise.primaryMuscleSnapshot,
      equipment: exercise.equipmentSnapshot,
      targetSets: exercise.targetSetsSnapshot,
      targetRepsMin: exercise.targetRepsMinSnapshot,
      targetRepsMax: exercise.targetRepsMaxSnapshot,
      targetLoad: exercise.targetLoadSnapshot,
      weightUnit: exercise.weightUnitSnapshot,
      status: exercise.status,
      completedSets: completedSetCounts.get(exercise.id) ?? 0,
    })
  );

  const currentExercise =
    snapshots.find(
      (exercise) => exercise.position === session.currentExercisePosition
    ) ??
    snapshots.find((exercise) =>
      ["pending", "in_progress"].includes(exercise.status)
    ) ??
    null;

  const remainingExercises = snapshots
    .filter(
      (exercise) =>
        ["pending", "in_progress"].includes(exercise.status) &&
        exercise.sessionExerciseId !== currentExercise?.sessionExerciseId
    )
    .map((exercise) => ({
      position: exercise.position,
      name: exercise.name,
      status: exercise.status,
    }));

  return {
    sessionId: session.id,
    title: session.titleSnapshot,
    status: session.status,
    currentExercisePosition: session.currentExercisePosition,
    currentExercise,
    remainingExercises,
    exercises: snapshots,
  };
}

export function trainingSummaryForPrompt(
  summary: TrainingSummaryForPrompt | null
) {
  if (!summary?.hasHistory) {
    return null;
  }

  return {
    weeklySessionsCompleted: summary.weeklySessionsCompleted,
    weeklySessionsPlanned: summary.weeklySessionsPlanned,
    weeklyVolume: summary.weeklyVolume,
    previousWeeklyVolume: summary.previousWeeklyVolume,
    volumeChangePercent: summary.volumeChangePercent,
    volumeUnit: summary.volumeUnit,
    recentSessions: summary.recentSessions,
    topLifts: summary.topLifts.map((lift) => ({
      exerciseName: lift.exerciseName,
      bestSet:
        lift.load != null && lift.reps != null
          ? `${lift.load}${lift.weightUnit} × ${lift.reps}`
          : null,
      sessionDate: lift.sessionDate,
    })),
    progressiveOverloadHints: summary.progressiveOverloadHints,
  };
}
