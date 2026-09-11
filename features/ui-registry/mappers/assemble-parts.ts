import type { ProposeWorkoutPlanResult } from "@/features/plans/schemas";
import type { StoredChatPart } from "../schemas/envelope";
import { parseChatParts } from "../schemas/envelope";

export type ToolResultForAssembly = {
  toolName: string;
  output: unknown;
};

function isProposeSuccess(
  output: unknown
): output is Extract<ProposeWorkoutPlanResult, { ok: true }> {
  if (!output || typeof output !== "object") return false;
  const value = output as ProposeWorkoutPlanResult;
  return value.ok === true && typeof value.planId === "string";
}

export function findProposedDraft(
  toolResults: ToolResultForAssembly[]
): Extract<ProposeWorkoutPlanResult, { ok: true }> | null {
  const matches = toolResults.filter(
    (result) =>
      result.toolName === "propose_workout_plan" &&
      isProposeSuccess(result.output)
  );

  const last = matches.at(-1);
  return last && isProposeSuccess(last.output) ? last.output : null;
}

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

    if (
      result.toolName === "propose_workout_plan" &&
      isProposeSuccess(result.output)
    ) {
      const draft = result.output;

      parts.push({
        id: crypto.randomUUID(),
        type: "workout_plan",
        schemaVersion: 1,
        data: {
          planId: draft.planId,
          versionId: draft.versionId,
          state: draft.state,
          title: draft.title,
          goal: draft.goal,
          daysPerWeek: draft.daysPerWeek,
          estimatedWeeklyMinutes: draft.estimatedWeeklyMinutes,
          summary: draft.summary,
        },
      });

      parts.push({
        id: crypto.randomUUID(),
        type: "weekly_schedule",
        schemaVersion: 1,
        data: {
          planId: draft.planId,
          versionId: draft.versionId,
          schedulingMode: draft.schedulingMode,
          days: draft.days,
        },
      });
    }
  }

  return parseChatParts(parts);
}
