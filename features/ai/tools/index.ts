import type { ToolSet } from "ai";
import type { PlanningContext } from "../planning-context";
import { createProposeWorkoutPlanTool } from "./propose-workout-plan";
import { createSavePlanningFactsTool } from "./save-planning-facts";
import { createShowEquipmentPickerTool } from "./show-equipment-picker";

export type CoachToolName =
  | "save_planning_facts"
  | "show_equipment_picker"
  | "propose_workout_plan";

export function getAllowedCoachTools(
  context: PlanningContext
): CoachToolName[] {
  const tools: CoachToolName[] = ["save_planning_facts"];

  if (context.missingSlots.includes("equipment")) {
    tools.push("show_equipment_picker");
  }

  if (context.purpose === "planner" && context.allowPropose) {
    tools.push("propose_workout_plan");
  }

  return tools;
}

export function createCoachTools(params: {
  userId: string;
  threadId: string;
  planningContext: PlanningContext;
  allowedTools: CoachToolName[];
}): ToolSet {
  const { planningContext, allowedTools } = params;
  const tools: ToolSet = {};

  if (allowedTools.includes("save_planning_facts")) {
    tools.save_planning_facts = createSavePlanningFactsTool({
      userId: params.userId,
      threadId: params.threadId,
    });
  }

  if (allowedTools.includes("show_equipment_picker")) {
    tools.show_equipment_picker = createShowEquipmentPickerTool({
      userId: params.userId,
      equipmentCatalog: planningContext.equipmentCatalog,
    });
  }

  if (allowedTools.includes("propose_workout_plan")) {
    tools.propose_workout_plan = createProposeWorkoutPlanTool({
      userId: params.userId,
      planningContext,
    });
  }

  return tools;
}
