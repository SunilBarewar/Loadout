import {
  createUIMessageStreamResponse,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { ensureCurrentUser, getUserProfileWithEquipment } from "@/features/users";
import {
  buildPlanningContext,
  COACH_MODEL,
  createCoachStream,
  detectSkipRemainingSlots,
} from "@/features/ai";
import {
  getChatThreadById,
  getThreadMessages,
  insertAssistantMessage,
  insertUserMessage,
  mergeThreadPlanningFacts,
  setThreadRelatedPlanId,
  storedMessagesToUIMessages,
} from "@/features/planner/repository";
import { getPlanSummaryForContext } from "@/features/plans/repository";
import {
  assembleChatParts,
  findProposedDraft,
} from "@/features/ui-registry/mappers/assemble-parts";

export const maxDuration = 60;

function extractLatestUserMessageText(messages: UIMessage[]): string | null {
  const lastUser = [...messages].reverse().find((message) => message.role === "user");
  if (!lastUser) return null;

  const text = lastUser.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join("")
    .trim();

  return text || null;
}

export async function POST(req: Request) {
  const user = await ensureCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const {
    id: threadId,
    messages: clientMessages,
  }: {
    id?: string;
    messages: UIMessage[];
  } = body;

  if (!threadId) {
    return new Response("Missing thread id", { status: 400 });
  }

  const thread = await getChatThreadById(threadId, user.id);
  if (!thread) {
    return new Response("Thread not found or unauthorized", { status: 404 });
  }

  const latestClientUserText = extractLatestUserMessageText(clientMessages);
  if (latestClientUserText) {
    const lastUserMessage = [...clientMessages]
      .reverse()
      .find((message) => message.role === "user");

    await insertUserMessage({
      clientMessageId: lastUserMessage?.id,
      threadId,
      userId: user.id,
      content: latestClientUserText,
    });
  }

  const profileBundle = await getUserProfileWithEquipment(user.id);
  if (!profileBundle) {
    return new Response("User profile not found", { status: 404 });
  }

  const dbMessages = await getThreadMessages(threadId, user.id, 20);
  const uiMessages = storedMessagesToUIMessages(dbMessages);
  const latestUserMessage = extractLatestUserMessageText(uiMessages);

  if (
    latestUserMessage &&
    detectSkipRemainingSlots(latestUserMessage) &&
    !thread.planningFacts?.skipRemainingSlots
  ) {
    await mergeThreadPlanningFacts(threadId, user.id, {
      skipRemainingSlots: true,
    });
  }

  const refreshedThread = await getChatThreadById(threadId, user.id);
  const relatedPlanId =
    refreshedThread?.relatedPlanId ?? thread.relatedPlanId ?? null;
  const activePlanSummary =
    relatedPlanId
      ? await getPlanSummaryForContext(relatedPlanId, user.id)
      : null;

  const planningContext = buildPlanningContext({
    purpose: thread.purpose,
    relatedPlanId,
    activePlanSummary,
    profile: profileBundle.profile,
    equipmentSlugs: profileBundle.equipmentSlugs,
    equipmentCatalog: profileBundle.equipmentCatalog,
    threadFacts: refreshedThread?.planningFacts ?? thread.planningFacts,
    latestUserMessage,
  });

  const result = await createCoachStream({
    threadId,
    purpose: thread.purpose,
    planningContext,
    messages: uiMessages,
    onFinish: async (event) => {
      const text = event.steps
        .map((step) => step.text)
        .filter(Boolean)
        .join("\n\n")
        .trim();

      const toolResults = event.steps.flatMap((step) =>
        step.toolResults.map((toolResult) => ({
          toolName: toolResult.toolName,
          output: toolResult.output,
        }))
      );
      const parts = assembleChatParts({ text, toolResults });
      const proposed = findProposedDraft(toolResults);

      if (parts.length > 0) {
        await insertAssistantMessage({
          threadId,
          userId: user.id,
          content: text,
          model: COACH_MODEL,
          customParts: parts,
        });
      } else if (text) {
        await insertAssistantMessage({
          threadId,
          userId: user.id,
          content: text,
          model: COACH_MODEL,
        });
      }

      if (proposed) {
        await setThreadRelatedPlanId(threadId, user.id, proposed.planId);
      }
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
