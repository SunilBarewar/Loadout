import type { ToolSet } from "ai";
import type { PlanningContext } from "../planning-context";
import { createProposeWorkoutPlanTool } from "./propose-workout-plan";
import { createReviseWorkoutPlanTool } from "./revise-workout-plan";
import { createSavePlanningFactsTool } from "./save-planning-facts";
import { createShowEquipmentPickerTool } from "./show-equipment-picker";
import { createSuggestExerciseAlternativesTool } from "./suggest-exercise-alternatives";
import { createShowProgressSnapshotTool } from "./show-progress-snapshot";

export type CoachToolName =
  | "save_planning_facts"
  | "show_equipment_picker"
  | "propose_workout_plan"
  | "revise_workout_plan"
  | "suggest_exercise_alternatives"
  | "show_progress_snapshot";

export function getAllowedCoachTools(
  context: PlanningContext
): CoachToolName[] {
  const tools: CoachToolName[] = ["save_planning_facts"];

  if (context.missingSlots.includes("equipment")) {
    tools.push("show_equipment_picker");
  }

  if (
    context.trainingSummary?.hasHistory &&
    (context.purpose === "planner" || context.purpose === "plan_revision")
  ) {
    tools.push("show_progress_snapshot");
  }

  if (context.purpose === "session_swap" && context.sessionContext) {
    tools.push("suggest_exercise_alternatives");
  } else if (context.relatedPlanId) {
    tools.push("revise_workout_plan");
  } else if (context.purpose === "planner" && context.allowPropose) {
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

  if (allowedTools.includes("revise_workout_plan")) {
    tools.revise_workout_plan = createReviseWorkoutPlanTool({
      userId: params.userId,
      planningContext,
    });
  }

  if (allowedTools.includes("suggest_exercise_alternatives")) {
    tools.suggest_exercise_alternatives = createSuggestExerciseAlternativesTool({
      planningContext,
    });
  }

  if (allowedTools.includes("show_progress_snapshot")) {
    tools.show_progress_snapshot = createShowProgressSnapshotTool({
      planningContext,
    });
  }

  return tools;
}
