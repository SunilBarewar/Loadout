import { z } from "zod";
import { textPartDataSchema } from "./text";
import { equipmentPickerPartDataSchema } from "./equipment-picker";
import { planUpdatePartDataSchema } from "./plan-update";
import { workoutPlanPartDataSchema } from "./workout-plan";
import { weeklySchedulePartDataSchema } from "./weekly-schedule";

const chatPartEnvelopeBase = {
  id: z.string().uuid(),
  schemaVersion: z.literal(1),
};

export const textChatPartSchema = z.object({
  ...chatPartEnvelopeBase,
  type: z.literal("text"),
  data: textPartDataSchema,
});

export const equipmentPickerChatPartSchema = z.object({
  ...chatPartEnvelopeBase,
  type: z.literal("equipment_picker"),
  data: equipmentPickerPartDataSchema,
});

export const workoutPlanChatPartSchema = z.object({
  ...chatPartEnvelopeBase,
  type: z.literal("workout_plan"),
  data: workoutPlanPartDataSchema,
});

export const weeklyScheduleChatPartSchema = z.object({
  ...chatPartEnvelopeBase,
  type: z.literal("weekly_schedule"),
  data: weeklySchedulePartDataSchema,
});

export const planUpdateChatPartSchema = z.object({
  ...chatPartEnvelopeBase,
  type: z.literal("plan_update"),
  data: planUpdatePartDataSchema,
});

export const chatPartSchema = z.discriminatedUnion("type", [
  textChatPartSchema,
  equipmentPickerChatPartSchema,
  workoutPlanChatPartSchema,
  weeklyScheduleChatPartSchema,
  planUpdateChatPartSchema,
]);

export type StoredChatPart = z.infer<typeof chatPartSchema>;
export type ChatPartType = StoredChatPart["type"];

export type ChatPartEnvelope<
  TType extends ChatPartType,
  TData,
> = {
  id: string;
  type: TType;
  schemaVersion: 1;
  data: TData;
};

export function parseChatParts(parts: unknown): StoredChatPart[] {
  if (!Array.isArray(parts)) {
    return [];
  }

  const validated: StoredChatPart[] = [];

  for (const part of parts) {
    const result = chatPartSchema.safeParse(part);
    if (result.success) {
      validated.push(result.data);
    }
  }

  return validated;
}
