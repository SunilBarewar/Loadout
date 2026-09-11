"use client";

import Link from "next/link";
import { CalendarDays, Target } from "lucide-react";
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
}

const stateLabels: Record<WorkoutPlanPartData["state"], string> = {
  draft: "Draft",
  saved: "Saved",
  active: "Active",
};

export function WorkoutPlanCard({ data }: WorkoutPlanCardProps) {
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
      </CardContent>
      <CardFooter className="gap-2">
        <Button render={<Link href={`/plans?planId=${data.planId}`} />} size="sm">
          View plan
        </Button>
        {data.state === "draft" && (
          <Button variant="outline" size="sm" disabled>
            Save draft
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
