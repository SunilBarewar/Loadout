import { tool } from "ai";
import { getEffectivePlanningFacts } from "../planning-context";
import type { PlanningContext } from "../planning-context";
import {
  insertDraftPlan,
  PlanCompilerError,
} from "@/features/plans/repository";
import {
  proposeWorkoutPlanSchema,
  type ProposeWorkoutPlanResult,
} from "@/features/plans/schemas";

export function createProposeWorkoutPlanTool(params: {
  userId: string;
  planningContext: PlanningContext;
}) {
  return tool({
    description:
      "Compile a complete weekly workout program into a draft plan. Call only when the user wants a plan and planning context is complete (allowPropose is true). Supply the full domain program (title, days, exercises). Never invent planId or other database IDs — the server inserts rows and returns IDs. Match equipment to the user's available slugs, daysPerWeek and session length to context, and respect limitations. Do not put JSON in the user-visible reply.",
    inputSchema: proposeWorkoutPlanSchema,
    execute: async (input): Promise<ProposeWorkoutPlanResult> => {
      if (!params.planningContext.allowPropose) {
        return {
          ok: false,
          error:
            "Planning context is incomplete. Save missing facts before proposing a plan.",
        };
      }

      const effective = getEffectivePlanningFacts(params.planningContext);

      try {
        const inserted = await insertDraftPlan({
          userId: params.userId,
          domain: input,
          availableEquipmentSlugs: effective.equipmentSlugs,
          weightUnit: effective.weightUnit,
        });

        return {
          ok: true,
          ...inserted,
        };
      } catch (error) {
        const message =
          error instanceof PlanCompilerError
            ? error.message
            : "Could not save this draft plan. Ask me to try again with a simpler program.";

        return { ok: false, error: message };
      }
    },
  });
}
