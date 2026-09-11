import "server-only";

import { db } from "@/db";
import { chatMessages, chatThreads, type ChatThread, type ChatMessage } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import type { StoredChatPart } from "@/features/ui-registry/schemas/envelope";
import { storedMessagesToUIMessages } from "@/features/ui-registry/mappers/stored-to-ui";

export type { StoredChatPart };
export { storedMessagesToUIMessages };

export async function createChatThread(params: {
  userId: string;
  purpose?: "planner" | "plan_revision" | "session_swap" | "onboarding";
  title?: string;
  relatedPlanId?: string;
  relatedSessionId?: string;
}): Promise<ChatThread> {
  const [thread] = await db
    .insert(chatThreads)
    .values({
      userId: params.userId,
      purpose: params.purpose ?? "planner",
      title: params.title ?? "New planning session",
      relatedPlanId: params.relatedPlanId ?? null,
      relatedSessionId: params.relatedSessionId ?? null,
    })
    .returning();

  return thread;
}

export async function getChatThreadById(
  threadId: string,
  userId: string
): Promise<ChatThread | null> {
  const [thread] = await db
    .select()
    .from(chatThreads)
    .where(and(eq(chatThreads.id, threadId), eq(chatThreads.userId, userId)))
    .limit(1);

  return thread ?? null;
}

export async function listChatThreadsByUser(
  userId: string,
  limitCount = 30
): Promise<Array<ChatThread & { messageCount: number; latestMessageSnippet?: string }>> {
  const threads = await db
    .select()
    .from(chatThreads)
    .where(eq(chatThreads.userId, userId))
    .orderBy(desc(chatThreads.updatedAt))
    .limit(limitCount);

  // Hydrate message count and latest snippet for each thread
  const result = await Promise.all(
    threads.map(async (thread) => {
      const messages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.threadId, thread.id))
        .orderBy(desc(chatMessages.createdAt))
        .limit(1);

      // Extract snippet if available
      let snippet: string | undefined;
      if (messages.length > 0) {
        const parts = messages[0].parts as StoredChatPart[];
        const textPart = parts.find((p) => p.type === "text");
        if (textPart) {
          snippet = textPart.data.content;
        }
      }

      return {
        ...thread,
        messageCount: messages.length, // Can count via separate aggregate if needed
        latestMessageSnippet: snippet,
      };
    })
  );

  return result;
}

export async function getThreadMessages(
  threadId: string,
  userId: string,
  limitCount = 30
): Promise<ChatMessage[]> {
  // Verify ownership first
  const thread = await getChatThreadById(threadId, userId);
  if (!thread) {
    return [];
  }

  const messages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.threadId, threadId))
    .orderBy(chatMessages.createdAt)
    .limit(limitCount);

  return messages;
}

export async function insertUserMessage(params: {
  clientMessageId?: string;
  threadId: string;
  userId: string;
  content: string;
}): Promise<ChatMessage | null> {
  const thread = await getChatThreadById(params.threadId, params.userId);
  if (!thread) {
    return null;
  }

  const partId = crypto.randomUUID();
  const parts: StoredChatPart[] = [
    {
      id: partId,
      type: "text",
      schemaVersion: 1,
      data: {
        content: params.content,
        ...(params.clientMessageId
          ? { clientMessageId: params.clientMessageId }
          : {}),
      },
    },
  ];

  // If thread title is default, update it with truncated prompt
  if (!thread.title || thread.title === "New planning session") {
    const trimmedTitle = params.content.slice(0, 60).trim();
    if (trimmedTitle) {
      await db
        .update(chatThreads)
        .set({ title: trimmedTitle, updatedAt: new Date() })
        .where(eq(chatThreads.id, params.threadId));
    }
  } else {
    await db
      .update(chatThreads)
      .set({ updatedAt: new Date() })
      .where(eq(chatThreads.id, params.threadId));
  }

  // Idempotency check using the AI SDK client message id stored in parts
  if (params.clientMessageId) {
    const recentMessages = await db
      .select()
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.threadId, params.threadId),
          eq(chatMessages.role, "user")
        )
      )
      .orderBy(desc(chatMessages.createdAt))
      .limit(10);

    const existing = recentMessages.find((message) => {
      const storedParts = message.parts as StoredChatPart[];
      return storedParts.some(
        (part) =>
          part.type === "text" &&
          part.data.clientMessageId === params.clientMessageId
      );
    });

    if (existing) {
      return existing;
    }
  }

  const [message] = await db
    .insert(chatMessages)
    .values({
      threadId: params.threadId,
      role: "user",
      parts,
    })
    .returning();

  return message;
}

export async function insertAssistantMessage(params: {
  threadId: string;
  userId: string;
  content: string;
  model?: string;
  customParts?: StoredChatPart[];
}): Promise<ChatMessage | null> {
  const thread = await getChatThreadById(params.threadId, params.userId);
  if (!thread) {
    return null;
  }

  const parts: StoredChatPart[] = params.customParts ?? [
    {
      id: crypto.randomUUID(),
      type: "text",
      schemaVersion: 1,
      data: { content: params.content },
    },
  ];

  await db
    .update(chatThreads)
    .set({ updatedAt: new Date() })
    .where(eq(chatThreads.id, params.threadId));

  const [message] = await db
    .insert(chatMessages)
    .values({
      threadId: params.threadId,
      role: "assistant",
      parts,
      model: params.model ?? "gemini-3.5-flash",
    })
    .returning();

  return message;
}

