import {
  createUIMessageStream,
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
  getCoachConversationMessages,
  insertAssistantMessage,
  insertUserMessage,
  mergeThreadPlanningFacts,
  setThreadRelatedPlanId,
  storedMessagesToUIMessages,
  updateThreadSummary,
} from "@/features/planner/repository";
import {
  getSessionContextForCoach,
  getTrainingSummaryForUser,
} from "@/features/ai/training-context";
import {
  shouldSummarizeThread,
  summarizeThreadMessages,
} from "@/features/ai/thread-summary";
import { getPlanSummaryForContext } from "@/features/plans/repository";
import {
  assembleChatParts,
  findProposedDraft,
  streamChunksFromToolResults,
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
  const lastUserMessage = [...clientMessages]
    .reverse()
    .find((message) => message.role === "user");

  const stream = createUIMessageStream({
    originalMessages: clientMessages,
    execute: async ({ writer }) => {
      if (latestClientUserText) {
        await insertUserMessage({
          clientMessageId: lastUserMessage?.id,
          threadId,
          userId: user.id,
          content: latestClientUserText,
        });
      }

      const profileBundle = await getUserProfileWithEquipment(user.id);
      if (!profileBundle) {
        throw new Error("User profile not found");
      }

      let coachConversation = await getCoachConversationMessages(
        threadId,
        user.id
      );

      if (
        coachConversation.messagesToSummarize.length > 0 &&
        shouldSummarizeThread(
          coachConversation.messages.length +
            coachConversation.messagesToSummarize.length
        )
      ) {
        const refreshedThread = await getChatThreadById(threadId, user.id);
        const nextSummary = await summarizeThreadMessages(
          coachConversation.messagesToSummarize,
          refreshedThread?.summary ?? coachConversation.summary
        );
        await updateThreadSummary(threadId, user.id, nextSummary);
        coachConversation = await getCoachConversationMessages(threadId, user.id);
      }

      const uiMessages = storedMessagesToUIMessages(coachConversation.messages);
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
      const relatedSessionId =
        refreshedThread?.relatedSessionId ?? thread.relatedSessionId ?? null;

      const [activePlanSummary, trainingSummary, sessionContext] =
        await Promise.all([
          relatedPlanId
            ? getPlanSummaryForContext(relatedPlanId, user.id)
            : Promise.resolve(null),
          getTrainingSummaryForUser(
            user.id,
            profileBundle.profile.weightUnit
          ),
          relatedSessionId
            ? getSessionContextForCoach(relatedSessionId, user.id)
            : Promise.resolve(null),
        ]);

      const planningContext = buildPlanningContext({
        purpose: thread.purpose,
        relatedPlanId,
        relatedSessionId,
        activePlanSummary,
        trainingSummary,
        sessionContext,
        threadSummary: coachConversation.summary?.content ?? null,
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
        onStepEnd: (step) => {
          const toolResults = step.toolResults.map((toolResult) => ({
            toolName: toolResult.toolName,
            output: toolResult.output,
          }));

          for (const chunk of streamChunksFromToolResults(toolResults)) {
            writer.write(chunk);
          }
        },
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

      writer.merge(
        toUIMessageStream({
          stream: result.stream,
          originalMessages: uiMessages,
        })
      );
    },
  });

  return createUIMessageStreamResponse({ stream });
}
