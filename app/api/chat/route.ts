import { google } from "@ai-sdk/google";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { ensureCurrentUser } from "@/features/users";
import {
  getChatThreadById,
  insertUserMessage,
  insertAssistantMessage,
} from "@/features/planner/repository";

export const maxDuration = 30;

export async function POST(req: Request) {
  const user = await ensureCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const {
    id: threadId,
    messages,
  }: {
    id?: string;
    messages: UIMessage[];
  } = body;

  if (!threadId) {
    return new Response("Missing thread id", { status: 400 });
  }

  // 1. Authorize thread ownership
  const thread = await getChatThreadById(threadId, user.id);
  if (!thread) {
    return new Response("Thread not found or unauthorized", { status: 404 });
  }

  // 2. Persist incoming user message (the last message in the list)
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
  if (lastUserMessage) {
    const textPart = lastUserMessage.parts?.find(
      (p: { type: string; text?: string }) => p.type === "text" && p.text
    );
    const content = textPart && "text" in textPart ? (textPart.text as string) : "";
    if (content) {
      await insertUserMessage({
        clientMessageId: lastUserMessage.id,
        threadId,
        userId: user.id,
        content,
      });
    }
  }

  // 3. Stream response with Gemini
  const result = streamText({
    model: google("gemini-3.5-flash"),
    instructions:
      "You are Loadout, a concise AI workout planner. Answer the user's training questions in clear plain text. Do not generate HTML or JSX.",
    messages: await convertToModelMessages(messages),
    onFinish: async ({ text }) => {
      // 4. Persist assistant response
      if (text) {
        await insertAssistantMessage({
          threadId,
          userId: user.id,
          content: text,
          model: "gemini-3.5-flash",
        });
      }
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
