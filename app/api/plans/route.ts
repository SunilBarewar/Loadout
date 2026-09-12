import { NextResponse } from "next/server";
import { ensureCurrentUser } from "@/features/users";
import { listPlansForUser } from "@/features/plans/repository";
import { mapPlanListItem } from "@/features/plans/formatters";

export async function GET() {
  const user = await ensureCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plans = await listPlansForUser(user.id);
  const items = plans.map(mapPlanListItem);
  const activePlan = items.find((plan) => plan.state === "active") ?? null;
  const otherPlans = items.filter((plan) => plan.state !== "active");

  return NextResponse.json({
    activePlan,
    otherPlans,
  });
}
