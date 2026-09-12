"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlanListItemView } from "@/features/plans/schemas";

const stateLabels: Record<PlanListItemView["state"], string> = {
  draft: "Draft",
  saved: "Saved",
  active: "Active Routine",
};

type PlanCardProps = {
  plan: PlanListItemView;
  highlighted?: boolean;
};

export function PlanCard({ plan, highlighted = false }: PlanCardProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSaveDraft() {
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/plans/${plan.planId}/save`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId: plan.versionId }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Could not save this plan.");
        return;
      }

      router.refresh();
    });
  }

  function handleActivate() {
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/plans/${plan.planId}/activate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId: plan.versionId }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Could not activate this plan.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <div
      className={`rounded-md border border-border bg-card p-6 space-y-4 ${
        highlighted ? "ring-1 ring-primary/20" : ""
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1 min-w-0">
          <div
            className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-border text-xs font-semibold ${
              plan.state === "active"
                ? "bg-surface-2 text-primary"
                : "bg-surface-2 text-muted-foreground"
            }`}
          >
            {stateLabels[plan.state]}
          </div>
          <h2 className="font-display font-bold text-2xl text-foreground">
            {plan.title}
          </h2>
        </div>
        <span className="text-xs text-muted-foreground font-mono shrink-0">
          {plan.metaLabel}
          {plan.estimatedWeeklyMinutes != null
            ? ` · ~${plan.estimatedWeeklyMinutes} min / week`
            : ""}
        </span>
      </div>

      {plan.summary && (
        <p className="text-sm text-muted-foreground">{plan.summary}</p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          nativeButton={false}
          render={<Link href={`/plan/${plan.planId}`} />}
          size="sm"
        >
          View plan
        </Button>
        {plan.state === "draft" && (
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={handleSaveDraft}
          >
            {isPending ? "Saving…" : "Save draft"}
          </Button>
        )}
        {(plan.state === "saved" || plan.state === "draft") && (
          <Button size="sm" disabled={isPending} onClick={handleActivate}>
            <CheckCircle2 className="size-3.5" />
            {isPending ? "Activating…" : "Set as active"}
          </Button>
        )}
      </div>
    </div>
  );
}
