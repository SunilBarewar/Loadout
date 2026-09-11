import type { StoredChatPart } from "../schemas/envelope";
import { parseChatParts } from "../schemas/envelope";

export type ToolResultForAssembly = {
  toolName: string;
  output: unknown;
};

export function assembleChatParts(params: {
  text: string;
  toolResults: ToolResultForAssembly[];
}): StoredChatPart[] {
  const parts: StoredChatPart[] = [];

  const trimmedText = params.text.trim();
  if (trimmedText) {
    parts.push({
      id: crypto.randomUUID(),
      type: "text",
      schemaVersion: 1,
      data: { content: trimmedText },
    });
  }

  for (const result of params.toolResults) {
    if (result.toolName === "show_equipment_picker") {
      const output = result.output as { uiPart?: StoredChatPart } | undefined;
      if (output?.uiPart) {
        parts.push(output.uiPart);
      }
    }
  }

  return parseChatParts(parts);
}
