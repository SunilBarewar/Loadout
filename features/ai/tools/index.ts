import type { ToolSet } from "ai";
import type { PlanningContext } from "../planning-context";
import { createSavePlanningFactsTool } from "./save-planning-facts";
import { createShowEquipmentPickerTool } from "./show-equipment-picker";

export type CoachToolName = "save_planning_facts" | "show_equipment_picker";

export function getAllowedCoachTools(
  context: PlanningContext
): CoachToolName[] {
  const tools: CoachToolName[] = ["save_planning_facts"];

  if (context.missingSlots.includes("equipment")) {
    tools.push("show_equipment_picker");
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

  return tools;
}
