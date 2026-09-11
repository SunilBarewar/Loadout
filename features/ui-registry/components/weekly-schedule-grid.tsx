"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { WeeklySchedulePartData } from "../schemas/weekly-schedule";

interface WeeklyScheduleGridProps {
  data: WeeklySchedulePartData;
}

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function WeeklyScheduleGrid({ data }: WeeklyScheduleGridProps) {
  const isFlexible = data.schedulingMode === "flexible_sequence";

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Weekly schedule</CardTitle>
        <CardDescription>
          {isFlexible
            ? "Flexible day sequence — start with Day 1 when you are ready."
            : "Fixed weekday assignments for this plan."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2">
          {data.days.map((day) => (
            <Link
              key={day.planDayId}
              href={`/plan/${data.planId}`}
              className={cn(
                "rounded-lg border border-border bg-surface-2 p-3 space-y-1",
                "hover:border-primary/40 transition-colors block"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-primary">
                  {isFlexible
                    ? `Day ${day.dayNumber}`
                    : day.weekday != null
                      ? weekdayLabels[day.weekday]
                      : `Day ${day.dayNumber}`}
                </span>
                {day.estimatedMinutes != null && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="size-3" />
                    {day.estimatedMinutes}m
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-foreground leading-snug">
                {day.title}
              </p>
              {day.focus && (
                <p className="text-xs text-muted-foreground">{day.focus}</p>
              )}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
