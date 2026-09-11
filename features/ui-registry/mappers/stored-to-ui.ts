import type { UIMessage } from "ai";
import type { ChatMessage } from "@/db/schema";
import {
  parseChatParts,
  type StoredChatPart,
} from "../schemas/envelope";

export function storedPartToUIMessagePart(
  part: StoredChatPart
): UIMessage["parts"][number] {
  if (part.type === "text") {
    return {
      type: "text",
      text: part.data.content,
    };
  }

  return {
    type: `data-${part.type}`,
    id: part.id,
    data: part.data,
  } as UIMessage["parts"][number];
}

export function storedPartsToUIMessageParts(
  parts: unknown
): UIMessage["parts"] {
  return parseChatParts(parts).map(storedPartToUIMessagePart);
}

export function storedMessagesToUIMessages(
  messages: ChatMessage[]
): UIMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role as "user" | "assistant" | "system",
    parts: storedPartsToUIMessageParts(message.parts),
    createdAt: message.createdAt,
  }));
}
