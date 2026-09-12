"use server";

import { redirect } from "next/navigation";
import { ensureCurrentUser } from "@/features/users";
import { getActivePlanForUser } from "@/features/plans";
import { startSessionFromPlanDay } from "./repository";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type StartSessionResult =
  | { ok: true; sessionId: string }
  | { ok: false; error: string };

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
    return { ok: false, error: "Activate a workout plan before starting a session." };
  }

  const planDay = activePlan.days.find((day) => day.id === planDayId);
  if (!planDay) {
    return { ok: false, error: "That workout day is not part of your active plan." };
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
