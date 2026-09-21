"use server";

import { ensureCurrentUser, setUserEquipmentSlugs } from "@/features/users";
import {
  createChatThread,
  listChatThreadsByUser,
  mergeThreadPlanningFacts,
} from "@/features/planner/repository";
import type { ChatThreadItem } from "@/features/planner/types";
import { buildSessionSwapInitialPrompt } from "@/features/planner/session-swap-prompt";

export type SaveUserEquipmentResult =
  | { ok: true; slugs: string[] }
  | { ok: false; error: string };

export async function saveUserEquipmentSelectionAction(
  threadId: string,
  equipmentSlugs: string[]
): Promise<SaveUserEquipmentResult> {
  const user = await ensureCurrentUser();
  if (!user) {
    return { ok: false, error: "You must be signed in to save equipment." };
  }

  if (equipmentSlugs.length === 0) {
    return { ok: false, error: "Select at least one piece of equipment." };
  }

  const validSlugs = await setUserEquipmentSlugs(user.id, equipmentSlugs);
  if (validSlugs.length === 0) {
    return { ok: false, error: "None of the selected equipment is in the catalog." };
  }

  await mergeThreadPlanningFacts(threadId, user.id, {
    equipmentSlugs: validSlugs,
  });

  return { ok: true, slugs: validSlugs };
}

export async function createSessionSwapThreadAction(params: {
  sessionId: string;
  sessionExerciseId: string;
  reason?: string;
}): Promise<
  | { ok: true; threadId: string; initialPrompt: string }
  | { ok: false; error: string }
> {
  const user = await ensureCurrentUser();
  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (
    !uuidPattern.test(params.sessionId) ||
    !uuidPattern.test(params.sessionExerciseId)
  ) {
    return { ok: false, error: "Invalid session or exercise." };
  }

  const { getSessionWithExercises } = await import(
    "@/features/sessions/repository"
  );
  const loaded = await getSessionWithExercises(params.sessionId, user.id);

  if (!loaded || !["active", "paused"].includes(loaded.session.status)) {
    return { ok: false, error: "Session is not active." };
  }

  const exercise = loaded.exercises.find(
    (item) => item.id === params.sessionExerciseId
  );

  if (
    !exercise ||
    ["completed", "skipped", "replaced"].includes(exercise.status)
  ) {
    return { ok: false, error: "Exercise cannot be swapped." };
  }

  const thread = await createChatThread({
    userId: user.id,
    purpose: "session_swap",
    relatedSessionId: params.sessionId,
    title: `Swap ${exercise.nameSnapshot.slice(0, 40)}`,
  });

  return {
    ok: true,
    threadId: thread.id,
    initialPrompt: buildSessionSwapInitialPrompt({
      exerciseName: exercise.nameSnapshot,
      reason: params.reason,
    }),
  };
}

export async function createPlannerThreadAction(initialPrompt?: string): Promise<string> {
  const user = await ensureCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const title = initialPrompt?.trim()
    ? initialPrompt.trim().slice(0, 60)
    : "New planning session";

  const thread = await createChatThread({
    userId: user.id,
    purpose: "planner",
    title,
  });

  return thread.id;
}

export async function getUserThreadsAction(): Promise<ChatThreadItem[]> {
  const user = await ensureCurrentUser();
  if (!user) {
    return [];
  }

  const threads = await listChatThreadsByUser(user.id);

  return threads.map((t) => {
    const date = new Date(t.updatedAt);
    const timeAgo = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    return {
      id: t.id,
      title: t.title || "Workout routine chat",
      purpose: (t.purpose as "planner" | "plan_revision" | "session_swap") || "planner",
      snippet:
        t.latestMessageSnippet ||
        "Conversational training thread with Loadout AI coach.",
      updatedAt: timeAgo,
      createdAt: t.createdAt.toISOString().slice(0, 10),
      messageCount: t.messageCount,
    };
  });
}
