"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, CheckCircle2, Target } from "lucide-react";
import {
  activatePlanAction,
  savePlanDraftAction,
} from "@/features/plans/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { WorkoutPlanPartData } from "../schemas/workout-plan";

interface WorkoutPlanCardProps {
  data: WorkoutPlanPartData;
  threadId?: string;
}

const stateLabels: Record<WorkoutPlanPartData["state"], string> = {
  draft: "Draft",
  saved: "Saved",
  active: "Active",
};

export function WorkoutPlanCard({ data, threadId }: WorkoutPlanCardProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSaveDraft() {
    setError(null);
    startTransition(async () => {
      const result = await savePlanDraftAction(
        data.planId,
        data.versionId,
        threadId
      );

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.refresh();
    });
  }

  function handleActivate() {
    setError(null);
    startTransition(async () => {
      const result = await activatePlanAction(
        data.planId,
        data.versionId,
        threadId
      );

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.refresh();
    });
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle className="truncate">{data.title}</CardTitle>
            {data.goal && (
              <CardDescription className="flex items-center gap-1.5">
                <Target className="size-3.5 shrink-0" />
                <span className="capitalize">{data.goal.replace(/_/g, " ")}</span>
              </CardDescription>
            )}
          </div>
          <Badge variant="secondary">{stateLabels[data.state]}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            {data.daysPerWeek} days / week
          </span>
          {data.estimatedWeeklyMinutes != null && (
            <span>~{data.estimatedWeeklyMinutes} min / week</span>
          )}
        </div>
        {data.summary && (
          <p className="text-sm text-foreground/90 leading-relaxed">
            {data.summary}
          </p>
        )}
        {data.state === "draft" && data.isRevision && (
          <p className="text-sm text-muted-foreground">
            Review the updated schedule below, then save this revision to keep
            the changes.
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
      <CardFooter className="gap-2">
        <Button render={<Link href={`/plan/${data.planId}`} />} size="sm">
          View plan
        </Button>
        {data.state === "draft" && (
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={handleSaveDraft}
          >
            {isPending
              ? "Saving…"
              : data.isRevision
                ? "Save revision"
                : "Save draft"}
          </Button>
        )}
        {data.state === "saved" && (
          <Button
            size="sm"
            disabled={isPending}
            onClick={handleActivate}
          >
            <CheckCircle2 className="size-3.5" />
            {isPending ? "Activating…" : "Activate plan"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
