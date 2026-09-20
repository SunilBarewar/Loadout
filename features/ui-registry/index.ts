export { uiRegistry } from "./registry";

export { ChatPartRenderer } from "./components/chat-part-renderer";
export { ChatText } from "./components/chat-text";
export { EquipmentPickerCard } from "./components/equipment-picker-card";
export { PlanUpdateCard } from "./components/plan-update-card";
export { WorkoutPlanCard } from "./components/workout-plan-card";
export { WeeklyScheduleGrid } from "./components/weekly-schedule-grid";

export {
  chatPartSchema,
  parseChatParts,
  type ChatPartEnvelope,
  type ChatPartType,
  type StoredChatPart,
} from "./schemas/envelope";

export {
  storedPartToUIMessagePart,
  storedPartsToUIMessageParts,
  storedMessagesToUIMessages,
} from "./mappers/stored-to-ui";

export {
  assembleChatParts,
  findProposedDraft,
  type ToolResultForAssembly,
} from "./mappers/assemble-parts";

export {
  buildMessagesSyncKey,
  extractPlanIdsFromMessages,
  hydrateStoredMessages,
  hydrateStoredParts,
  type StoredPartsHydrationContext,
} from "./mappers/hydrate-stored-parts";

export type { TextPartData } from "./schemas/text";
export type { EquipmentPickerPartData } from "./schemas/equipment-picker";
export type { PlanUpdatePartData } from "./schemas/plan-update";
export type { WorkoutPlanPartData } from "./schemas/workout-plan";
export type { WeeklySchedulePartData } from "./schemas/weekly-schedule";
