import type {
  ProposeWorkoutPlanResult,
  ReviseWorkoutPlanResult,
} from "@/features/plans/schemas";
import type { StoredChatPart } from "../schemas/envelope";
import { parseChatParts } from "../schemas/envelope";

export type ToolResultForAssembly = {
  toolName: string;
  output: unknown;
};

type PlanToolSuccess = Extract<ProposeWorkoutPlanResult, { ok: true }>;

function isPlanToolSuccess(output: unknown): output is PlanToolSuccess {
  if (!output || typeof output !== "object") return false;
  const value = output as ProposeWorkoutPlanResult | ReviseWorkoutPlanResult;
  return value.ok === true && typeof value.planId === "string";
}

function buildPlanCardParts(
  draft: PlanToolSuccess,
  options?: { isRevision?: boolean }
): StoredChatPart[] {
  return [
    {
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
        isRevision: options?.isRevision ?? false,
      },
    },
    {
      id: crypto.randomUUID(),
      type: "weekly_schedule",
      schemaVersion: 1,
      data: {
        planId: draft.planId,
        versionId: draft.versionId,
        schedulingMode: draft.schedulingMode,
        days: draft.days,
      },
    },
  ];
}

export function findProposedDraft(
  toolResults: ToolResultForAssembly[]
): PlanToolSuccess | null {
  const matches = toolResults.filter(
    (result) =>
      (result.toolName === "propose_workout_plan" ||
        result.toolName === "revise_workout_plan") &&
      isPlanToolSuccess(result.output)
  );

  const last = matches.at(-1);
  return last && isPlanToolSuccess(last.output) ? last.output : null;
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
      isPlanToolSuccess(result.output)
    ) {
      parts.push(...buildPlanCardParts(result.output));
    }

    if (
      result.toolName === "revise_workout_plan" &&
      isPlanToolSuccess(result.output)
    ) {
      parts.push(...buildPlanCardParts(result.output, { isRevision: true }));
    }
  }

  return parseChatParts(parts);
}
