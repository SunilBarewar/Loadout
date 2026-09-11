import type { ChatMessage, Equipment } from "@/db/schema";
import type { EquipmentPickerPartData } from "../schemas/equipment-picker";
import {
  parseChatParts,
  type StoredChatPart,
} from "../schemas/envelope";
import { buildEquipmentPickerData } from "./equipment-picker-data";

export type StoredPartsHydrationContext = {
  equipmentCatalog: Equipment[];
  equipmentSlugs: string[];
};

function hydrateEquipmentPickerPart(
  part: Extract<StoredChatPart, { type: "equipment_picker" }>,
  context: StoredPartsHydrationContext
): Extract<StoredChatPart, { type: "equipment_picker" }> {
  const existing = part.data as EquipmentPickerPartData;

  return {
    ...part,
    data: buildEquipmentPickerData({
      selectionMode: existing.selectionMode,
      catalog: context.equipmentCatalog,
      selectedSlugs: context.equipmentSlugs,
      allowCustomNotes: existing.allowCustomNotes,
    }),
  };
}

export function hydrateStoredParts(
  parts: unknown,
  context: StoredPartsHydrationContext
): StoredChatPart[] {
  return parseChatParts(parts).map((part) => {
    if (part.type === "equipment_picker") {
      return hydrateEquipmentPickerPart(part, context);
    }

    return part;
  });
}

export function hydrateStoredMessages(
  messages: ChatMessage[],
  context: StoredPartsHydrationContext
): ChatMessage[] {
  return messages.map((message) => ({
    ...message,
    parts: hydrateStoredParts(message.parts, context),
  }));
}

export function buildMessagesSyncKey(messages: ChatMessage[]): string {
  return messages
    .map((message) => {
      const parts = parseChatParts(message.parts);
      const partSignature = parts
        .map((part) => `${part.type}:${part.id}`)
        .join(",");
      return `${message.id}:${partSignature}`;
    })
    .join("|");
}
