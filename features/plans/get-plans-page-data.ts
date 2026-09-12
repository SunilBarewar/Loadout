import "server-only";

import type { User } from "@/db";
import { listPlansForUser } from "./repository";
import { mapPlanListItem } from "./formatters";
import type { PlansPageData } from "./schemas";

export async function getPlansPageData(user: User): Promise<PlansPageData> {
  const plans = await listPlansForUser(user.id);
  const items = plans.map(mapPlanListItem);

  const activePlan = items.find((plan) => plan.state === "active") ?? null;
  const otherPlans = items.filter((plan) => plan.state !== "active");

  return {
    activePlan,
    otherPlans,
  };
}
