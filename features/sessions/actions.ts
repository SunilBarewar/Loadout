"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureCurrentUser } from "@/features/users";
import { getActivePlanForUser } from "@/features/plans";
import {
  endSession,
  logSet,
  pauseSession,
  resumeSession,
  startSessionFromPlanDay,
} from "./repository";
import type { EndSessionMode, LogSetResult } from "./schemas";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

  const planDay = activePlan.days.find((day) => day.id === planDayId);
  if (!planDay) {
    return {
      ok: false,
      error: "That workout day is not part of your active plan.",
    };
  }

  const { sessionId } = await startSessionFromPlanDay({
    userId: user.id,
    plan: activePlan.plan,
    version: activePlan.version,
    planDay,
    weightUnit: user.weightUnit,
  });

  redirect(`/session/${sessionId}`);
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
  mode: EndSessionMode
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

  const updated = await endSession({
    sessionId,
    userId: user.id,
    mode,
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
  performedReps: number;
  performedLoad?: string | null;
  rpe?: string | null;
  status?: "completed" | "failed" | "skipped";
}): Promise<LogSetActionResult> {
  if (
    !uuidPattern.test(input.sessionId) ||
    !uuidPattern.test(input.sessionExerciseId)
  ) {
    return { ok: false, error: "Invalid session or exercise." };
  }

  if (
    !Number.isInteger(input.setNumber) ||
    input.setNumber < 1 ||
    !Number.isInteger(input.performedReps) ||
    input.performedReps < 1
  ) {
    return { ok: false, error: "Invalid set data." };
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
    status: input.status,
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
