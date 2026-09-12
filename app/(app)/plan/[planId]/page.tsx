import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ensureCurrentUser } from "@/features/users";
import { getPlanWithVersion } from "@/features/plans";
import { WEEKDAY_LABELS } from "@/features/plans/weekdays";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const user = await ensureCurrentUser();
  if (!user) {
    notFound();
  }

  const { planId } = await params;
  if (!uuidPattern.test(planId)) {
    notFound();
  }

  const loaded = await getPlanWithVersion(planId, user.id);
  if (!loaded) {
    notFound();
  }

  const { plan, version, days } = loaded;
  const weeklyMinutes = days.reduce(
    (total, day) => total + (day.estimatedMinutes ?? 0),
    0
  );

  return (
    <div className="w-full max-w-295 mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
      <div className="flex items-start justify-between gap-4 pb-2 border-b border-border">
        <div className="min-w-0 space-y-2">
          <Link
            href="/planner"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back to planner
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-foreground">
              {plan.title}
            </h1>
            <Badge variant="secondary" className="capitalize">
              {plan.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Version {version.versionNumber}
            {plan.goal ? ` · ${plan.goal.replace(/_/g, " ")}` : ""}
            {` · ${plan.daysPerWeek} days / week`}
            {weeklyMinutes > 0 ? ` · ~${weeklyMinutes} min / week` : ""}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {days.map((day) => (
          <section
            key={day.id}
            className="rounded-md border border-border bg-card p-5 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-primary">
                 
                Day {day.dayNumber}
                {day.scheduledWeekday != null
                  ? ` · ${WEEKDAY_LABELS[day.scheduledWeekday]}`
                  : null}
                </p>
                <h2 className="font-display font-bold text-xl text-foreground">
                  {day.title}
                </h2>
                {day.focus && (
                  <p className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
                    <Target className="size-3.5" />
                    {day.focus}
                  </p>
                )}
              </div>
              {day.estimatedMinutes != null && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3.5" />
                  {day.estimatedMinutes}m
                </span>
              )}
            </div>

            {day.instructions && (
              <p className="text-sm text-foreground/90 leading-relaxed">
                {day.instructions}
              </p>
            )}

            <ol className="space-y-3">
              {day.exercises.map((exercise) => (
                <li
                  key={exercise.id}
                  className="rounded-lg border border-border bg-surface-2 p-3 space-y-1"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {exercise.position}. {exercise.name}
                    </p>
                    <p className="text-xs text-muted-foreground shrink-0">
                      {exercise.targetSets} × {exercise.targetRepsMin}
                      {exercise.targetRepsMax !== exercise.targetRepsMin
                        ? `–${exercise.targetRepsMax}`
                        : ""}{" "}
                      · {exercise.restSeconds}s rest
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {exercise.primaryMuscleGroup}
                    {exercise.equipmentSlug
                      ? ` · ${exercise.equipmentSlug.replace(/-/g, " ")}`
                      : ""}
                  </p>
                  {exercise.notes && (
                    <p className="text-xs text-foreground/80">{exercise.notes}</p>
                  )}
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
