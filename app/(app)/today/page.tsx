import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ChevronRight,
  Clock,
  Dumbbell,
  Flame,
  Layers,
  Plus,
} from "lucide-react";
import { ensureCurrentUser } from "@/features/users";
import { getTodayPageData } from "@/features/today/get-today-page-data";
import { formatVolume } from "@/features/today/formatters";
import { TodaySessionCta } from "@/features/today/components/today-session-cta";

export default async function TodayPage() {
  const user = await ensureCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const data = await getTodayPageData(user);

  return (
    <div className="w-full max-w-295 mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            {data.dateLabel}
          </div>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl tracking-tight text-foreground leading-none">
            TODAY&apos;S SESSION
          </h1>
        </div>

        {data.adherence && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card text-xs text-muted-foreground self-start sm:self-auto">
            <span className="size-2 rounded-full bg-primary" />
            <span className="font-medium text-foreground">
              {data.adherence.dayLabel}
            </span>
            <span className="text-muted-foreground">
              · {data.adherence.completedThisWeek}/
              {data.adherence.plannedThisWeek} completed
            </span>
          </div>
        )}
      </div>

      {!data.hasActivePlan ? (
        <div className="rounded-md border border-border bg-card p-6 sm:p-8 space-y-4 text-center">
          <div className="inline-flex items-center justify-center size-12 rounded-full border border-border bg-surface-2">
            <Layers className="size-5 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display font-bold text-2xl text-foreground">
              No active routine yet
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Create a plan with the AI coach, save it, and activate it to see
              today&apos;s workout here.
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
      ) : data.isRestDay ? (
        <div className="rounded-md border border-border bg-card p-6 sm:p-8 space-y-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-border bg-surface-2 text-xs font-semibold text-muted-foreground">
              {data.workout?.planTitle ?? "Active plan"}
            </div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-foreground tracking-tight">
              Rest day
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            No workout is scheduled for today. Recovery is part of the program.
          </p>
          <TodaySessionCta
            hasActivePlan={data.hasActivePlan}
            isRestDay={data.isRestDay}
            planDayId={null}
            session={data.session}
          />
        </div>
      ) : data.workout ? (
        <div className="rounded-md border border-border bg-card p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              {data.workout.planGoalLabel && (
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-border bg-surface-2 text-xs font-semibold text-muted-foreground">
                  {data.workout.planGoalLabel}
                </div>
              )}
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-foreground tracking-tight">
                {data.workout.dayTitle}
              </h2>
              {data.workout.focus && (
                <p className="text-sm text-muted-foreground">
                  {data.workout.focus}
                </p>
              )}
            </div>

            <div className="flex items-center gap-6 text-sm">
              {data.workout.estimatedMinutes != null && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-4 text-primary" />
                  <span>~{data.workout.estimatedMinutes} min</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Dumbbell className="size-4 text-primary" />
                <span>
                  {data.workout.exerciseCount} exercises · {data.workout.totalSets}{" "}
                  sets
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-border bg-surface-2/40 divide-y divide-border overflow-hidden">
            {data.workout.exercises.map((exercise) => (
              <div
                key={exercise.position}
                className="flex items-center justify-between px-4 py-3 hover:bg-surface-2/70 transition-colors text-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs text-muted-foreground font-semibold">
                    {exercise.orderLabel}
                  </span>
                  <span className="font-medium text-foreground truncate">
                    {exercise.name}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                  {exercise.loadLabel && (
                    <span className="hidden sm:inline">{exercise.loadLabel}</span>
                  )}
                  <span className="font-mono bg-card px-2 py-1 rounded border border-border text-foreground">
                    {exercise.targetLabel}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {data.workout.equipmentLabel && (
              <p className="text-xs text-muted-foreground">
                Equipment ready: {data.workout.equipmentLabel}.
              </p>
            )}

            <TodaySessionCta
              hasActivePlan={data.hasActivePlan}
              isRestDay={data.isRestDay}
              planDayId={data.workout.planDayId}
              session={data.session}
            />
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-md border border-border bg-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Weekly Streak</span>
            <Flame className="size-4 text-primary" />
          </div>
          <div className="font-display font-extrabold text-3xl text-foreground">
            {data.stats.weeklySessionCount} SESSION
            {data.stats.weeklySessionCount === 1 ? "" : "S"}
          </div>
          <p className="text-xs text-muted-foreground">
            {data.stats.streakDescription}
          </p>
        </div>

        <div className="rounded-md border border-border bg-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Total Volume</span>
            <Dumbbell className="size-4 text-muted-foreground" />
          </div>
          <div className="font-display font-extrabold text-3xl text-foreground">
            {formatVolume(data.stats.weeklyVolume)}{" "}
            <span className="text-base font-sans font-normal text-muted-foreground">
              {data.stats.volumeUnit}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {data.stats.volumeChangePercent != null
              ? `${data.stats.volumeChangePercent >= 0 ? "+" : ""}${data.stats.volumeChangePercent.toFixed(1)}% load progression from previous week.`
              : "Log sets during workouts to track weekly volume."}
          </p>
        </div>

        <div className="rounded-md border border-border bg-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Tomorrow</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </div>
          {data.tomorrow ? (
            <>
              <div className="font-display font-extrabold text-2xl text-foreground truncate">
                {data.tomorrow.title}
              </div>
              <p className="text-xs text-muted-foreground">
                {data.tomorrow.subtitle}
              </p>
            </>
          ) : (
            <>
              <div className="font-display font-extrabold text-2xl text-foreground truncate">
                —
              </div>
              <p className="text-xs text-muted-foreground">
                Activate a plan to preview upcoming workouts.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
