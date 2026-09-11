import { tool } from "ai";
import { z } from "zod";
import { planningFactsInputSchema } from "../schemas/planning-facts";
import {
  mergeThreadPlanningFacts,
} from "@/features/planner/repository";
import {
  setUserEquipmentSlugs,
  updateUserPlanningProfile,
} from "@/features/users/repository";

const savePlanningFactsToolSchema = planningFactsInputSchema;

export type SavePlanningFactsResult = {
  ok: true;
  savedFields: string[];
};

export function createSavePlanningFactsTool(params: {
  userId: string;
  threadId: string;
}) {
  return tool({
    description:
      "Persist planning facts the user stated (goal, experience, days per week, session minutes, equipment slugs, limitations, weight unit). Call whenever the user shares any of these — do not wait until all slots are filled.",
    inputSchema: savePlanningFactsToolSchema,
    execute: async (input): Promise<SavePlanningFactsResult> => {
      const savedFields: string[] = [];

      const profileFields = {
        primaryGoal: input.primaryGoal,
        experienceLevel: input.experienceLevel,
        defaultDaysPerWeek: input.defaultDaysPerWeek,
        defaultSessionMinutes: input.defaultSessionMinutes,
        limitations: input.limitations,
        weightUnit: input.weightUnit,
      };

      const hasProfileUpdate = Object.values(profileFields).some(
        (value) => value !== undefined
      );

      if (hasProfileUpdate) {
        await updateUserPlanningProfile(params.userId, profileFields);
        for (const [key, value] of Object.entries(profileFields)) {
          if (value !== undefined) savedFields.push(key);
        }
      }

      if (input.equipmentSlugs !== undefined) {
        const validSlugs = await setUserEquipmentSlugs(
          params.userId,
          input.equipmentSlugs
        );
        savedFields.push("equipmentSlugs");
        await mergeThreadPlanningFacts(params.threadId, params.userId, {
          equipmentSlugs: validSlugs,
        });
      }

      const threadOnlyFields: Partial<typeof input> = {
        primaryGoal: input.primaryGoal,
        experienceLevel: input.experienceLevel,
        defaultDaysPerWeek: input.defaultDaysPerWeek,
        defaultSessionMinutes: input.defaultSessionMinutes,
        limitations: input.limitations,
        limitationsConfirmedNone: input.limitationsConfirmedNone,
        weightUnit: input.weightUnit,
        skipRemainingSlots: input.skipRemainingSlots,
      };

      const threadPatch = Object.fromEntries(
        Object.entries(threadOnlyFields).filter(([, value]) => value !== undefined)
      );

      if (Object.keys(threadPatch).length > 0) {
        await mergeThreadPlanningFacts(params.threadId, params.userId, threadPatch);
      }

      return { ok: true, savedFields };
    },
  });
}
