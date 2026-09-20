"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, CheckCircle2, Target } from "lucide-react";
import {
  activatePlanAction,
  savePlanDraftAction,
} from "@/features/plans/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
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
  const [state, setState] = useState(data.state);
  const [isSaving, startSaveTransition] = useTransition();
  const [isActivating, startActivateTransition] = useTransition();

  useEffect(() => {
    setState(data.state);
  }, [data.state]);

  function handleSaveDraft() {
    setError(null);
    startSaveTransition(async () => {
      const result = await savePlanDraftAction(
        data.planId,
        data.versionId,
        threadId
      );

      if (!result.ok) {
        setError(result.error);
        toast.add({
          type: "error",
          title: data.isRevision ? "Could not save revision" : "Could not save draft",
          description: result.error,
        });
        return;
      }

      setState(result.state);
      toast.add({
        type: "success",
        title: data.isRevision ? "Revision saved" : "Draft saved",
        description: `${data.title} is ready to activate.`,
      });
      router.refresh();
    });
  }

  function handleActivate() {
    setError(null);
    startActivateTransition(async () => {
      const result = await activatePlanAction(
        data.planId,
        data.versionId,
        threadId
      );

      if (!result.ok) {
        setError(result.error);
        toast.add({
          type: "error",
          title: "Could not activate plan",
          description: result.error,
        });
        return;
      }

      setState(result.state);
      toast.add({
        type: "success",
        title: "Plan activated",
        description: `${data.title} is now your active routine.`,
      });
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
          <Badge variant="secondary">{stateLabels[state]}</Badge>
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
        {state === "draft" && data.isRevision && (
          <p className="text-sm text-muted-foreground">
            Review the updated schedule below, then save this revision to keep
            the changes.
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
      <CardFooter className="gap-2">
        <Button
          nativeButton={false}
          render={<Link href={`/plan/${data.planId}`} />}
          size="sm"
        >
          View plan
        </Button>
        {state === "draft" && (
          <Button
            variant="outline"
            size="sm"
            disabled={isSaving}
            onClick={handleSaveDraft}
          >
            {isSaving
              ? "Saving…"
              : data.isRevision
                ? "Save revision"
                : "Save draft"}
          </Button>
        )}
        {state === "saved" && (
          <Button
            size="sm"
            disabled={isActivating}
            onClick={handleActivate}
          >
            <CheckCircle2 className="size-3.5" />
            {isActivating ? "Activating…" : "Activate plan"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
