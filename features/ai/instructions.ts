import type { ChatThread } from "@/db/schema";
import {
  planningContextForPrompt,
  type PlanningContext,
} from "./planning-context";

const BASE_RULES = `You are Loadout, a concise AI workout planner — not a doctor.

Rules:
- Speak in plain text only. Never output JSON, HTML, or JSX in user-visible replies.
- Use the Planning context block below. Do not contradict filled slots or re-ask them.
- Ask at most one focused question cluster per turn (e.g. days + session length together).
- Prefer sensible defaults and say "I'll assume X — tell me if that's wrong" over long questionnaires.
- When the user gives planning facts (goal, days, equipment, time, experience, limitations), call save_planning_facts immediately.
- If equipment is missing and the user needs to choose gear, call show_equipment_picker instead of listing every option in text.
- Never invent planId, sessionId, or other database IDs.
- For pain or injuries: suggest alternatives and professional assessment; do not claim medical safety.`;

function purposeRules(purpose: ChatThread["purpose"]): string {
  switch (purpose) {
    case "onboarding":
      return `Purpose: onboarding. Gather missing planning essentials and help the user finish setup. Do not propose a full weekly program yet.`;
    case "planner":
      return `Purpose: planner. Help the user plan or revise training. Only call propose_workout_plan when allowPropose is true in context (not available yet in this build — focus on gathering facts and showing the equipment picker when needed).`;
    case "plan_revision":
      return `Purpose: plan revision. Focus on changing an existing saved plan.`;
    case "session_swap":
      return `Purpose: session swap. Focus on substituting exercises for an active session.`;
    default:
      return `Purpose: ${purpose}.`;
  }
}

export function buildCoachInstructions(
  purpose: ChatThread["purpose"],
  planningContext: PlanningContext
): string {
  const contextJson = JSON.stringify(
    planningContextForPrompt(planningContext),
    null,
    2
  );

  const missing = planningContext.missingSlots;
  const missingHint =
    missing.length > 0
      ? `Still missing: ${missing.join(", ")}. Ask about only these (one cluster max) or use show_equipment_picker if equipment is missing.`
      : planningContext.merged.skipRemainingSlots
        ? "User asked you to choose defaults. State the assumptions you are using."
        : "Planning context is complete. You may proceed when plan generation is enabled.";

  return `${BASE_RULES}

${purposeRules(purpose)}

${missingHint}

Planning context:
${contextJson}`;
}
