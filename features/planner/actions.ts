"use server";

import { ensureCurrentUser } from "@/features/users";
import { createChatThread, listChatThreadsByUser } from "@/features/planner/repository";
import type { ChatThreadItem } from "@/features/planner/types";

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
