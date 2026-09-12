import {
  formatDistanceToNow,
  isToday,
  isYesterday,
  differenceInMinutes,
} from "date-fns";
import type { SessionExercise, WorkoutSession } from "@/db";
import type {
  ActiveSessionHeaderData,
  HistorySessionItem,
  SerializedExercise,
  SerializedSession,
  SerializedSetLog,
  SessionPageData,
} from "./schemas";

export function formatSessionDuration(
  startedAt: Date,
  endedAt: Date | null
): string {
  if (!endedAt) {
    return "—";
  }

  const minutes = Math.max(1, differenceInMinutes(endedAt, startedAt));
  return `${minutes} min`;
}

export function formatHistoryDateLabel(date: Date): string {
  if (isToday(date)) {
    return "Today";
  }

  if (isYesterday(date)) {
    return "Yesterday";
  }

  const distance = formatDistanceToNow(date, { addSuffix: true });
  return distance.charAt(0).toUpperCase() + distance.slice(1);
}

export function serializeSession(session: WorkoutSession): SerializedSession {
  return {
    id: session.id,
    status: session.status,
    currentExercisePosition: session.currentExercisePosition,
    activeRestEndsAt: session.activeRestEndsAt?.toISOString() ?? null,
    startedAt: session.startedAt.toISOString(),
    endedAt: session.endedAt?.toISOString() ?? null,
    titleSnapshot: session.titleSnapshot,
  };
}

export function serializeExercise(
  exercise: SessionExercise
): SerializedExercise {
  return {
    id: exercise.id,
    position: exercise.position,
    nameSnapshot: exercise.nameSnapshot,
    targetSetsSnapshot: exercise.targetSetsSnapshot,
    targetRepsMinSnapshot: exercise.targetRepsMinSnapshot,
    targetRepsMaxSnapshot: exercise.targetRepsMaxSnapshot,
    targetLoadSnapshot: exercise.targetLoadSnapshot,
    weightUnitSnapshot: exercise.weightUnitSnapshot,
    restSecondsSnapshot: exercise.restSecondsSnapshot,
    status: exercise.status,
    notes: exercise.notes,
    replacementReason: exercise.replacementReason,
    replacesSessionExerciseId: exercise.replacesSessionExerciseId,
  };
}

export function serializeSetLog(log: {
  id: string;
  sessionExerciseId: string;
  setNumber: number;
  performedReps: number | null;
  performedLoad: string | null;
  weightUnit: "kg" | "lb" | null;
  status: "completed" | "failed" | "skipped";
  notes: string | null;
  completedAt: Date | null;
}): SerializedSetLog {
  return {
    id: log.id,
    sessionExerciseId: log.sessionExerciseId,
    setNumber: log.setNumber,
    performedReps: log.performedReps,
    performedLoad: log.performedLoad,
    weightUnit: log.weightUnit,
    status: log.status,
    notes: log.notes,
    completedAt: log.completedAt?.toISOString() ?? null,
  };
}

export function buildSessionPageData(params: {
  session: WorkoutSession;
  exercises: SessionExercise[];
  setLogs: Array<{
    id: string;
    sessionExerciseId: string;
    setNumber: number;
    performedReps: number | null;
    performedLoad: string | null;
    weightUnit: "kg" | "lb" | null;
    status: "completed" | "failed" | "skipped";
    notes: string | null;
    completedAt: Date | null;
  }>;
}): SessionPageData {
  const setLogsByExerciseId: Record<string, SerializedSetLog[]> = {};

  for (const log of params.setLogs) {
    const serialized = serializeSetLog(log);
    if (!setLogsByExerciseId[log.sessionExerciseId]) {
      setLogsByExerciseId[log.sessionExerciseId] = [];
    }
    setLogsByExerciseId[log.sessionExerciseId].push(serialized);
  }

  for (const logs of Object.values(setLogsByExerciseId)) {
    logs.sort((a, b) => a.setNumber - b.setNumber);
  }

  return {
    session: serializeSession(params.session),
    exercises: params.exercises.map(serializeExercise),
    setLogsByExerciseId,
  };
}

export function toActiveSessionHeaderData(
  session: WorkoutSession
): ActiveSessionHeaderData | null {
  if (session.status !== "active" && session.status !== "paused") {
    return null;
  }

  return {
    id: session.id,
    status: session.status,
    startedAt: session.startedAt.toISOString(),
  };
}

export function mapHistorySessionItem(item: {
  id: string;
  titleSnapshot: string;
  status: "completed" | "abandoned";
  startedAt: Date;
  endedAt: Date | null;
  setCount: number;
}): HistorySessionItem {
  const referenceDate = item.endedAt ?? item.startedAt;

  return {
    id: item.id,
    dateLabel: formatHistoryDateLabel(referenceDate),
    title: item.titleSnapshot,
    setCount: item.setCount,
    durationLabel: formatSessionDuration(item.startedAt, item.endedAt),
    status: item.status,
  };
}

export function formatTargetLabel(exercise: {
  targetSetsSnapshot: number;
  targetRepsMinSnapshot: number;
  targetRepsMaxSnapshot: number;
  targetLoadSnapshot: string | null;
  weightUnitSnapshot: "kg" | "lb" | null;
}): string {
  const reps =
    exercise.targetRepsMinSnapshot === exercise.targetRepsMaxSnapshot
      ? `${exercise.targetRepsMinSnapshot}`
      : `${exercise.targetRepsMinSnapshot}–${exercise.targetRepsMaxSnapshot}`;

  const load =
    exercise.targetLoadSnapshot != null
      ? ` · ${exercise.targetLoadSnapshot} ${exercise.weightUnitSnapshot ?? "lb"}`
      : "";

  return `${exercise.targetSetsSnapshot} sets × ${reps} reps${load}`;
}

export function formatLoggedSetLabel(log: SerializedSetLog): string {
  if (log.status === "skipped") {
    return log.notes ? `Skipped · ${log.notes}` : "Skipped";
  }

  if (log.status === "failed") {
    const reps = log.performedReps ?? "—";
    const base = `Failed · ${reps} reps`;
    return log.notes ? `${base} · ${log.notes}` : base;
  }

  const reps = log.performedReps ?? "—";
  const load =
    log.performedLoad != null
      ? `${log.performedLoad} ${log.weightUnit ?? "lb"}`
      : null;

  const base = load ? `${reps} reps @ ${load}` : `${reps} reps`;
  return log.notes ? `${base} · ${log.notes}` : base;
}

export function countTerminalSets(
  logs: SerializedSetLog[],
  targetSets: number
): number {
  const terminalStatuses = new Set(["completed", "failed", "skipped"]);
  const terminalCount = logs.filter((log) =>
    terminalStatuses.has(log.status)
  ).length;

  return Math.min(terminalCount, targetSets);
}
