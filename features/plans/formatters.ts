import type { PlanListItem } from "./repository";
import type { PlanListItemView } from "./schemas";

function formatGoalLabel(goal: string | null | undefined): string | null {
  if (!goal) {
    return null;
  }

  return goal
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildMetaLabel(plan: PlanListItem): string {
  const parts = [`${plan.daysPerWeek} days / week`];
  const goalLabel = formatGoalLabel(plan.goal);

  if (goalLabel) {
    parts.push(goalLabel);
  }

  return parts.join(" · ");
}

export function mapPlanListItem(plan: PlanListItem): PlanListItemView {
  return {
    planId: plan.planId,
    versionId: plan.versionId,
    title: plan.title,
    goalLabel: formatGoalLabel(plan.goal),
    daysPerWeek: plan.daysPerWeek,
    state: plan.state,
    estimatedWeeklyMinutes: plan.estimatedWeeklyMinutes,
    summary: plan.summary,
    metaLabel: buildMetaLabel(plan),
  };
}
