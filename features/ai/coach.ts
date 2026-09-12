import { openai } from '@ai-sdk/openai';
import {
  convertToModelMessages,
  isStepCount,
  streamText,
  type UIMessage,
} from "ai";
import type { ChatThread } from "@/db/schema";
import { buildCoachInstructions } from "./instructions";
import type { PlanningContext } from "./planning-context";
import { createCoachTools, getAllowedCoachTools } from "./tools";

export const COACH_MODEL = "gemini-3.5-flash";

export async function createCoachStream(params: {
  threadId: string;
  purpose: ChatThread["purpose"];
  planningContext: PlanningContext;
  messages: UIMessage[];
  onFinish?: Parameters<typeof streamText>[0]["onEnd"];
}) {
  const allowedTools = getAllowedCoachTools(params.planningContext);
  const tools = createCoachTools({
    userId: params.planningContext.profile.id,
    threadId: params.threadId,
    planningContext: params.planningContext,
    allowedTools,
  });

  return streamText({
    model: openai('gpt-4.1'),
    instructions: buildCoachInstructions(params.purpose, params.planningContext),
    messages: await convertToModelMessages(params.messages),
    tools,
    stopWhen: isStepCount(4),
    onEnd: params.onFinish,
  });
}
