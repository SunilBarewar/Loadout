"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { endOfDay, endOfWeek, startOfDay, startOfWeek } from "date-fns";
import { ensureCurrentUser } from "@/features/users";
import {
  ensurePlanDaysHaveWeekdays,
  getActivePlanForUser,
  inferSchedulingMode,
  resolvePlanDayForDate,
} from "@/features/plans";
import {
  endSession,
  finishExerciseEarly,
  getLastCompletedSessionForPlanInRange,
  logSet,
  pauseSession,
  replaceExercise,
  reorderSessionExercises,
  resumeSession,
  setCurrentExercise,
  skipExercise,
  startSessionFromPlanDay,
} from "./repository";
import type { EndSessionMode, LogSetResult } from "./schemas";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MAX_NOTES_LENGTH = 500;

export type StartSessionResult =
  | { ok: true; sessionId: string }
  | { ok: false; error: string };

export type SessionMutationResult =
  | { ok: true }
  | { ok: false; error: string };

export type LogSetActionResult =
  | { ok: true; data: LogSetResult }
  | { ok: false; error: string };

export type EndSessionActionResult =
  | { ok: true }
  | { ok: false; error: string };

function revalidateSessionPaths(sessionId: string) {
  revalidatePath("/today");
  revalidatePath("/history");
  revalidatePath(`/session/${sessionId}`);
}

function validateNotes(notes?: string | null): string | null {
  if (!notes) {
    return null;
  }

  const trimmed = notes.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.length > MAX_NOTES_LENGTH) {
    return trimmed.slice(0, MAX_NOTES_LENGTH);
  }

  return trimmed;
}

export async function startSessionAction(
  planDayId: string
): Promise<StartSessionResult> {
  if (!uuidPattern.test(planDayId)) {
    return { ok: false, error: "Invalid workout day." };
  }

  const user = await ensureCurrentUser();
  if (!user) {
    return { ok: false, error: "You must be signed in to start a session." };
  }

  const activePlan = await getActivePlanForUser(user.id);
  if (!activePlan) {
    return {
      ok: false,
      error: "Activate a workout plan before starting a session.",
    };
  }

  let planDay = activePlan.days.find((day) => day.id === planDayId);
  if (!planDay) {
    return {
      ok: false,
      error: "That workout day is not part of your active plan.",
    };
  }

  if (activePlan.days.some((day) => day.scheduledWeekday == null)) {
    const weekdayResult = await ensurePlanDaysHaveWeekdays({
      versionId: activePlan.version.id,
      daysPerWeek: activePlan.plan.daysPerWeek,
    });

    if (!weekdayResult.ok) {
      return { ok: false, error: weekdayResult.error };
    }

    const refreshedPlan = await getActivePlanForUser(user.id);
    planDay = refreshedPlan?.days.find((day) => day.id === planDayId);
    if (!planDay) {
      return {
        ok: false,
        error: "That workout day is not part of your active plan.",
      };
    }
  }

  const referenceDate = new Date();
  const schedulingMode = inferSchedulingMode(
    activePlan.days,
    activePlan.plan.daysPerWeek
  );

  const lastCompletedThisWeek = await getLastCompletedSessionForPlanInRange({
    userId: user.id,
    planId: activePlan.plan.id,
    rangeStart: startOfWeek(referenceDate, { weekStartsOn: 1 }),
    rangeEnd: endOfWeek(referenceDate, { weekStartsOn: 1 }),
  });

  const lastCompletedDayNumber = lastCompletedThisWeek?.sourcePlanDayId
    ? activePlan.days.find(
        (day) => day.id === lastCompletedThisWeek.sourcePlanDayId
      )?.dayNumber ?? null
    : null;

  const todaysPlanDay = resolvePlanDayForDate({
    days: activePlan.days,
    schedulingMode,
    referenceDate,
    lastCompletedDayNumber,
  });

  if (!todaysPlanDay) {
    return { ok: false, error: "No workout is scheduled for today." };
  }

  const result = await startSessionFromPlanDay({
    userId: user.id,
    plan: activePlan.plan,
    version: activePlan.version,
    planDay,
    weightUnit: user.weightUnit,
    dayStart: startOfDay(referenceDate),
    dayEnd: endOfDay(referenceDate),
    todaysPlanDayId: todaysPlanDay.id,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  redirect(`/session/${result.sessionId}`);
}

export async function pauseSessionAction(
  sessionId: string
): Promise<SessionMutationResult> {
  if (!uuidPattern.test(sessionId)) {
    return { ok: false, error: "Invalid session." };
  }

  const user = await ensureCurrentUser();
  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  const updated = await pauseSession(sessionId, user.id);
  if (!updated) {
    return { ok: false, error: "Session is not active or could not be paused." };
  }

  revalidateSessionPaths(sessionId);
  return { ok: true };
}

export async function resumeSessionAction(
  sessionId: string
): Promise<SessionMutationResult> {
  if (!uuidPattern.test(sessionId)) {
    return { ok: false, error: "Invalid session." };
  }

  const user = await ensureCurrentUser();
  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  const updated = await resumeSession(sessionId, user.id);
  if (!updated) {
    return {
      ok: false,
      error: "Session is not paused or could not be resumed.",
    };
  }

  revalidateSessionPaths(sessionId);
  return { ok: true };
}

export async function endSessionAction(
  sessionId: string,
  mode: EndSessionMode,
  notes?: string | null
): Promise<EndSessionActionResult> {
  if (!uuidPattern.test(sessionId)) {
    return { ok: false, error: "Invalid session." };
  }

  if (mode !== "complete" && mode !== "abandon") {
    return { ok: false, error: "Invalid end session mode." };
  }

  const user = await ensureCurrentUser();
  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  const validatedNotes = validateNotes(notes);
  const updated = await endSession({
    sessionId,
    userId: user.id,
    mode,
    notes: validatedNotes ?? undefined,
  });

  if (!updated) {
    return { ok: false, error: "Session could not be ended." };
  }

  revalidateSessionPaths(sessionId);
  redirect("/today");
}

export async function logSetAction(input: {
  sessionId: string;
  sessionExerciseId: string;
  setNumber: number;
  performedReps?: number | null;
  performedLoad?: string | null;
  rpe?: string | null;
  notes?: string | null;
  status?: "completed" | "failed" | "skipped";
}): Promise<LogSetActionResult> {
  if (
    !uuidPattern.test(input.sessionId) ||
    !uuidPattern.test(input.sessionExerciseId)
  ) {
    return { ok: false, error: "Invalid session or exercise." };
  }

  if (!Number.isInteger(input.setNumber) || input.setNumber < 1) {
    return { ok: false, error: "Invalid set data." };
  }

  const status = input.status ?? "completed";
  if (
    status === "completed" &&
    (!Number.isInteger(input.performedReps) || (input.performedReps ?? 0) < 1)
  ) {
    return { ok: false, error: "Completed sets require at least 1 rep." };
  }

  const user = await ensureCurrentUser();
  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  const result = await logSet({
    userId: user.id,
    sessionId: input.sessionId,
    sessionExerciseId: input.sessionExerciseId,
    setNumber: input.setNumber,
    performedReps: input.performedReps,
    performedLoad: input.performedLoad,
    rpe: input.rpe,
    notes: validateNotes(input.notes),
    status,
  });

  if (!result) {
    return {
      ok: false,
      error: "Could not log set. Resume the session if it is paused.",
    };
  }

  revalidateSessionPaths(input.sessionId);

  return {
    ok: true,
    data: {
      exerciseCompleted: result.exerciseCompleted,
      sessionCompleted: result.sessionCompleted,
      nextSetNumber: result.nextSetNumber,
      activeRestEndsAt: result.activeRestEndsAt?.toISOString() ?? null,
    },
  };
}

export async function finishExerciseEarlyAction(input: {
  sessionId: string;
  sessionExerciseId: string;
  notes?: string | null;
}): Promise<LogSetActionResult> {
  if (
    !uuidPattern.test(input.sessionId) ||
    !uuidPattern.test(input.sessionExerciseId)
  ) {
    return { ok: false, error: "Invalid session or exercise." };
  }

  const user = await ensureCurrentUser();
  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  const result = await finishExerciseEarly({
    userId: user.id,
    sessionId: input.sessionId,
    sessionExerciseId: input.sessionExerciseId,
    notes: validateNotes(input.notes),
  });

  if (!result) {
    return {
      ok: false,
      error: "Could not finish exercise. Resume the session if it is paused.",
    };
  }

  revalidateSessionPaths(input.sessionId);

  return {
    ok: true,
    data: {
      exerciseCompleted: result.exerciseCompleted,
      sessionCompleted: result.sessionCompleted,
      nextSetNumber: null,
      activeRestEndsAt: result.activeRestEndsAt?.toISOString() ?? null,
    },
  };
}

export async function skipExerciseAction(input: {
  sessionId: string;
  sessionExerciseId: string;
  notes?: string | null;
}): Promise<SessionMutationResult> {
  if (
    !uuidPattern.test(input.sessionId) ||
    !uuidPattern.test(input.sessionExerciseId)
  ) {
    return { ok: false, error: "Invalid session or exercise." };
  }

  const user = await ensureCurrentUser();
  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  const result = await skipExercise({
    userId: user.id,
    sessionId: input.sessionId,
    sessionExerciseId: input.sessionExerciseId,
    notes: validateNotes(input.notes),
  });

  if (!result) {
    return {
      ok: false,
      error: "Could not skip exercise. Resume the session if it is paused.",
    };
  }

  revalidateSessionPaths(input.sessionId);
  return { ok: true };
}

export async function applyExerciseSwapFromChatAction(input: {
  sessionId: string;
  sessionExerciseId: string;
  exerciseName: string;
  reason?: string | null;
  threadId?: string;
}): Promise<SessionMutationResult> {
  const result = await replaceExerciseAction({
    sessionId: input.sessionId,
    sessionExerciseId: input.sessionExerciseId,
    name: input.exerciseName,
    reason: input.reason,
  });

  if (result.ok && input.threadId) {
    revalidatePath(`/planner/${input.threadId}`);
  }

  return result;
}

export async function replaceExerciseAction(input: {
  sessionId: string;
  sessionExerciseId: string;
  name: string;
  reason?: string | null;
}): Promise<SessionMutationResult> {
  if (
    !uuidPattern.test(input.sessionId) ||
    !uuidPattern.test(input.sessionExerciseId)
  ) {
    return { ok: false, error: "Invalid session or exercise." };
  }

  if (!input.name.trim()) {
    return { ok: false, error: "Replacement exercise name is required." };
  }

  const user = await ensureCurrentUser();
  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  const result = await replaceExercise({
    userId: user.id,
    sessionId: input.sessionId,
    sessionExerciseId: input.sessionExerciseId,
    name: input.name.trim(),
    reason: validateNotes(input.reason),
  });

  if (!result) {
    return {
      ok: false,
      error: "Could not replace exercise. Resume the session if it is paused.",
    };
  }

  revalidateSessionPaths(input.sessionId);
  return { ok: true };
}

export async function setCurrentExerciseAction(input: {
  sessionId: string;
  position: number;
}): Promise<SessionMutationResult> {
  if (!uuidPattern.test(input.sessionId)) {
    return { ok: false, error: "Invalid session." };
  }

  if (!Number.isInteger(input.position) || input.position < 1) {
    return { ok: false, error: "Invalid exercise position." };
  }

  const user = await ensureCurrentUser();
  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  const updated = await setCurrentExercise({
    userId: user.id,
    sessionId: input.sessionId,
    position: input.position,
  });

  if (!updated) {
    return { ok: false, error: "Could not switch exercise." };
  }

  revalidateSessionPaths(input.sessionId);
  return { ok: true };
}

export async function reorderSessionExercisesAction(input: {
  sessionId: string;
  orderedExerciseIds: string[];
}): Promise<SessionMutationResult> {
  if (!uuidPattern.test(input.sessionId)) {
    return { ok: false, error: "Invalid session." };
  }

  if (
    input.orderedExerciseIds.length === 0 ||
    !input.orderedExerciseIds.every((id) => uuidPattern.test(id))
  ) {
    return { ok: false, error: "Invalid exercise order." };
  }

  const user = await ensureCurrentUser();
  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  const updated = await reorderSessionExercises({
    userId: user.id,
    sessionId: input.sessionId,
    orderedExerciseIds: input.orderedExerciseIds,
  });

  if (!updated) {
    return { ok: false, error: "Could not reorder exercises." };
  }

  revalidateSessionPaths(input.sessionId);
  return { ok: true };
}
