import "server-only";

import { getActivePlanForUser } from "@/features/plans";
import type { UserMenuData } from "./schemas";

export async function getUserMenuData(userId: string): Promise<UserMenuData> {
  const activePlan = await getActivePlanForUser(userId);

  return {
    activePlanTitle: activePlan?.plan.title ?? null,
  };
}
