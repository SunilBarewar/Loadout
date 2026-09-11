"use server";

import { ensureCurrentUser } from "@/features/users";
import { setThreadPurpose } from "@/features/planner/repository";
import { activatePlan, savePlanDraft } from "./repository";

export type SavePlanDraftResult =
  | { ok: true; state: "saved" }
  | { ok: false; error: string };

export type ActivatePlanResult =
  | { ok: true; state: "active" }
  | { ok: false; error: string };

export async function savePlanDraftAction(
  planId: string,
  versionId: string,
  threadId?: string
): Promise<SavePlanDraftResult> {
  const user = await ensureCurrentUser();
  if (!user) {
    return { ok: false, error: "You must be signed in to save a plan." };
  }

  const result = await savePlanDraft(planId, user.id, versionId);
  if (!result.ok) {
    return result;
  }

  if (threadId) {
    await setThreadPurpose(threadId, user.id, "plan_revision", planId);
  }

  return result;
}

export async function activatePlanAction(
  planId: string,
  versionId: string,
  threadId?: string
): Promise<ActivatePlanResult> {
  const user = await ensureCurrentUser();
  if (!user) {
    return { ok: false, error: "You must be signed in to activate a plan." };
  }

  const result = await activatePlan(planId, user.id, versionId);
  if (!result.ok) {
    return result;
  }

  if (threadId) {
    await setThreadPurpose(threadId, user.id, "plan_revision", planId);
  }

  return result;
}
