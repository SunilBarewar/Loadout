import Link from "next/link";
import { Layers, Plus } from "lucide-react";
import type { PlansPageData } from "@/features/plans/schemas";
import { PlanCard } from "./plan-card";

type PlansPageContentProps = {
  data: PlansPageData;
};

export function PlansPageContent({ data }: PlansPageContentProps) {
  const hasPlans = data.activePlan != null || data.otherPlans.length > 0;

  return (
    <div className="w-full max-w-295 mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-foreground">
            MY PLANS
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Saved routines and weekly training structure.
          </p>
        </div>
        <Link
          href="/planner"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="size-4" />
          <span>New routine</span>
        </Link>
      </div>

      {!hasPlans ? (
        <div className="rounded-md border border-border bg-card p-8 text-center space-y-4">
          <div className="mx-auto inline-flex items-center justify-center size-12 rounded-full border border-border bg-surface-2">
            <Layers className="size-5 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display font-bold text-2xl text-foreground">
              No plans yet
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Create a routine with the AI coach, save it, and set it as active
              to drive your Today page workouts.
            </p>
          </div>
          <Link
            href="/planner"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-md hover:bg-primary/90 transition-colors text-sm"
          >
            <Plus className="size-4" />
            Create a plan
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {data.activePlan && (
            <PlanCard plan={data.activePlan} highlighted />
          )}

          {data.otherPlans.length > 0 && (
            <div className="space-y-4">
              {data.activePlan && (
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Other routines
                </h2>
              )}
              {data.otherPlans.map((plan) => (
                <PlanCard key={plan.planId} plan={plan} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
