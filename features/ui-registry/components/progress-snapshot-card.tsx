"use client";

import { TrendingDown, TrendingUp, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatVolume } from "@/features/today/formatters";
import type { ProgressSnapshotPartData } from "../schemas/progress-snapshot";

interface ProgressSnapshotCardProps {
  data: ProgressSnapshotPartData;
}

export function ProgressSnapshotCard({ data }: ProgressSnapshotCardProps) {
  const volumeTrend =
    data.volumeChangePercent == null
      ? null
      : data.volumeChangePercent >= 0
        ? "up"
        : "down";

  return (
    <Card className="w-full border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-display">{data.headline}</CardTitle>
        <CardDescription>Based on your logged workout history</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border border-border bg-surface-2 p-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              This week
            </p>
            <p className="font-display text-2xl font-extrabold text-foreground mt-1">
              {data.weeklySessionsCompleted}
              {data.weeklySessionsPlanned != null && (
                <span className="text-sm font-medium text-muted-foreground">
                  {" "}
                  / {data.weeklySessionsPlanned}
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Sessions logged</p>
          </div>

          <div className="rounded-md border border-border bg-surface-2 p-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Volume
            </p>
            <div className="flex items-center gap-2 mt-1">
              <p className="font-display text-2xl font-extrabold text-foreground">
                {formatVolume(data.weeklyVolume)} {data.volumeUnit}
              </p>
              {volumeTrend && data.volumeChangePercent != null && (
                <Badge
                  variant="secondary"
                  className={
                    volumeTrend === "up"
                      ? "text-primary"
                      : "text-muted-foreground"
                  }
                >
                  {volumeTrend === "up" ? (
                    <TrendingUp className="size-3" />
                  ) : (
                    <TrendingDown className="size-3" />
                  )}
                  {Math.abs(data.volumeChangePercent).toFixed(0)}%
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">vs last week</p>
          </div>
        </div>

        {data.insights.length > 0 && (
          <ul className="space-y-2 text-sm text-foreground/90">
            {data.insights.map((insight) => (
              <li key={insight} className="flex gap-2">
                <span className="text-primary mt-1">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        )}

        {data.topLifts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Trophy className="size-3.5 text-primary" />
              Recent best sets
            </div>
            <div className="divide-y divide-border rounded-md border border-border overflow-hidden">
              {data.topLifts.map((lift) => (
                <div
                  key={`${lift.exerciseName}-${lift.sessionDate}`}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-sm bg-surface-2/50"
                >
                  <span className="font-medium truncate">{lift.exerciseName}</span>
                  <span className="text-xs text-muted-foreground shrink-0 font-mono">
                    {lift.bestSetLabel ?? "Logged"} · {lift.sessionDate}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
