import "server-only";

import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import type { ChatMessage, ThreadSummary } from "@/db/schema";
import type { StoredChatPart } from "@/features/ui-registry/schemas/envelope";

export const COACH_MESSAGE_WINDOW = 20;
export const SUMMARIZE_THRESHOLD = 25;

function getCoachModel() {
  return process.env.MODEL_PROVIDER === "openai"
    ? openai("gpt-4.1")
    : google("gemini-3.5-flash");
}

function extractTextFromParts(parts: unknown): string {
  if (!Array.isArray(parts)) {
    return "";
  }

  return (parts as StoredChatPart[])
    .filter((part) => part.type === "text")
    .map((part) => part.data.content)
    .join("\n")
    .trim();
}

function formatMessagesForSummary(messages: ChatMessage[]): string {
  return messages
    .map((message) => {
      const text = extractTextFromParts(message.parts);
      if (!text) return null;
      return `${message.role.toUpperCase()}: ${text}`;
    })
    .filter(Boolean)
    .join("\n\n");
}

export async function summarizeThreadMessages(
  messages: ChatMessage[],
  existingSummary: ThreadSummary | null
): Promise<ThreadSummary> {
  const transcript = formatMessagesForSummary(messages);
  const priorSummary = existingSummary?.content?.trim();

  const { text } = await generateText({
    model: getCoachModel(),
    system: `You summarize workout planning chat threads for an AI coach.
Capture: user goals, constraints, equipment, decisions made, plan changes, and open questions.
Keep facts the coach must not re-ask. Write 4-8 bullet points in plain text.`,
    prompt: priorSummary
      ? `Existing summary:\n${priorSummary}\n\nNew messages to merge:\n${transcript}`
      : `Summarize this thread:\n${transcript}`,
  });

  const lastMessage = messages.at(-1);

  return {
    content: text.trim(),
    summarizedMessageCount:
      (existingSummary?.summarizedMessageCount ?? 0) + messages.length,
    lastSummarizedMessageId: lastMessage?.id ?? null,
    updatedAt: new Date().toISOString(),
  };
}

export function shouldSummarizeThread(messageCount: number): boolean {
  return messageCount > SUMMARIZE_THRESHOLD;
}

export function selectMessagesForCoach(params: {
  messages: ChatMessage[];
  summary: ThreadSummary | null;
}): {
  summary: ThreadSummary | null;
  recentMessages: ChatMessage[];
  messagesToSummarize: ChatMessage[];
} {
  const { messages, summary } = params;

  if (messages.length <= COACH_MESSAGE_WINDOW) {
    return {
      summary,
      recentMessages: messages,
      messagesToSummarize: [],
    };
  }

  const splitIndex = messages.length - COACH_MESSAGE_WINDOW;
  const olderMessages = messages.slice(0, splitIndex);
  const recentMessages = messages.slice(splitIndex);

  const lastSummarizedId = summary?.lastSummarizedMessageId;
  const messagesToSummarize = lastSummarizedId
    ? olderMessages.filter((message) => {
        const summarizedIndex = olderMessages.findIndex(
          (item) => item.id === lastSummarizedId
        );
        if (summarizedIndex === -1) {
          return true;
        }
        const messageIndex = olderMessages.findIndex(
          (item) => item.id === message.id
        );
        return messageIndex > summarizedIndex;
      })
    : olderMessages;

  return {
    summary,
    recentMessages,
    messagesToSummarize,
  };
}
