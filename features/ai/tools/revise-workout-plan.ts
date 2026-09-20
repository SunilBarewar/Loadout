import { tool } from "ai";
import { getEffectivePlanningFacts } from "../planning-context";
import type { PlanningContext } from "../planning-context";
import {
  insertPlanRevision,
  PlanCompilerError,
} from "@/features/plans/repository";
import {
  reviseWorkoutPlanSchema,
  type ReviseWorkoutPlanResult,
} from "@/features/plans/schemas";

export function createReviseWorkoutPlanTool(params: {
  userId: string;
  planningContext: PlanningContext;
}) {
  const planId = params.planningContext.relatedPlanId;

  return tool({
    description:
      "Revise an existing workout plan by creating a new plan version. Call when the user wants to change their current program (days, exercises, duration, equipment, weekday assignments, etc.). Supply the full updated program plus a short changeSummary. Never invent planId — use the related plan from planning context. Match equipment to available slugs and respect limitations. For fixed_weekdays, set weekday using JavaScript convention: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday (Monday is 1). Saved and active plans are updated immediately; only draft plans require the user to save manually.",
    inputSchema: reviseWorkoutPlanSchema,
    execute: async (input): Promise<ReviseWorkoutPlanResult> => {
      if (!planId) {
        return {
          ok: false,
          error: "No related plan is linked to this thread.",
        };
      }

      const effective = getEffectivePlanningFacts(params.planningContext);

      try {
        const inserted = await insertPlanRevision({
          userId: params.userId,
          planId,
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
            : "Could not save this plan revision. Ask me to try again with a simpler change.";

        return { ok: false, error: message };
      }
    },
  });
}
