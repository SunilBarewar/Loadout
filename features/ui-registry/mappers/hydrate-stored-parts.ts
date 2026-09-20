import type { ChatMessage, Equipment } from "@/db/schema";
import type { PlanCardState } from "@/features/plans/schemas";
import type { EquipmentPickerPartData } from "../schemas/equipment-picker";
import type { PlanUpdatePartData } from "../schemas/plan-update";
import type { WorkoutPlanPartData } from "../schemas/workout-plan";
import {
  parseChatParts,
  type StoredChatPart,
} from "../schemas/envelope";
import { buildEquipmentPickerData } from "./equipment-picker-data";

export type StoredPartsHydrationContext = {
  equipmentCatalog: Equipment[];
  equipmentSlugs: string[];
  planStates?: Map<string, PlanCardState>;
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

function hydratePlanUpdatePart(
  part: Extract<StoredChatPart, { type: "plan_update" }>,
  context: StoredPartsHydrationContext
): Extract<StoredChatPart, { type: "plan_update" }> {
  const existing = part.data as PlanUpdatePartData;
  const liveState = context.planStates?.get(existing.planId);

  if (!liveState || liveState === existing.state) {
    return part;
  }

  return {
    ...part,
    data: {
      ...existing,
      state: liveState,
    },
  };
}

function hydrateWorkoutPlanPart(
  part: Extract<StoredChatPart, { type: "workout_plan" }>,
  context: StoredPartsHydrationContext
): Extract<StoredChatPart, { type: "workout_plan" }> {
  const existing = part.data as WorkoutPlanPartData;
  const liveState = context.planStates?.get(existing.planId);

  if (!liveState || liveState === existing.state) {
    return part;
  }

  return {
    ...part,
    data: {
      ...existing,
      state: liveState,
    },
  };
}

export function extractPlanIdsFromMessages(messages: ChatMessage[]): string[] {
  const planIds = new Set<string>();

  for (const message of messages) {
    for (const part of parseChatParts(message.parts)) {
      if (part.type === "workout_plan" || part.type === "plan_update") {
        planIds.add(part.data.planId);
      }
    }
  }

  return [...planIds];
}

export function hydrateStoredParts(
  parts: unknown,
  context: StoredPartsHydrationContext
): StoredChatPart[] {
  return parseChatParts(parts).map((part) => {
    if (part.type === "equipment_picker") {
      return hydrateEquipmentPickerPart(part, context);
    }

    if (part.type === "workout_plan") {
      return hydrateWorkoutPlanPart(part, context);
    }

    if (part.type === "plan_update") {
      return hydratePlanUpdatePart(part, context);
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
