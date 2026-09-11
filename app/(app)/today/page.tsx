import Link from "next/link";
import { Dumbbell, Clock, Flame, ArrowUpRight, CheckCircle2, ChevronRight } from "lucide-react";

export default function TodayPage() {
  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="w-full max-w-295 mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-8">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            {todayDate}
          </div>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl tracking-tight text-foreground leading-none">
            TODAY&apos;S SESSION
          </h1>
        </div>

        {/* Weekly Adherence Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card text-xs text-muted-foreground self-start sm:self-auto">
          <span className="size-2 rounded-full bg-primary" />
          <span className="font-medium text-foreground">Week 3 · Day 2</span>
          <span className="text-muted-foreground">· 3/4 completed</span>
        </div>
      </div>

      {/* 2. Dominant Workout Card */}
      <div className="rounded-md border border-border bg-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-border bg-surface-2 text-xs font-semibold text-muted-foreground">
              Upper Body Hypertrophy
            </div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-foreground tracking-tight">
              Push A — Chest, Shoulders & Triceps
            </h2>
          </div>

          {/* Target Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="size-4 text-primary" />
              <span>~45 min</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Dumbbell className="size-4 text-primary" />
              <span>5 exercises · 16 sets</span>
            </div>
          </div>
        </div>

        {/* Exercise List Breakdown */}
        <div className="rounded-md border border-border bg-surface-2/40 divide-y divide-border overflow-hidden">
          {[
            {
              order: "01",
              name: "Barbell Bench Press",
              target: "4 sets × 6–8 reps",
              load: "80 kg target",
              rest: "120s rest",
            },
            {
              order: "02",
              name: "Standing Dumbbell Overhead Press",
              target: "3 sets × 8–10 reps",
              load: "22 kg / hand",
              rest: "90s rest",
            },
            {
              order: "03",
              name: "Incline Dumbbell Press",
              target: "3 sets × 10–12 reps",
              load: "26 kg / hand",
              rest: "90s rest",
            },
            {
              order: "04",
              name: "Cable Lateral Raise",
              target: "3 sets × 12–15 reps",
              load: "7.5 kg pin",
              rest: "60s rest",
            },
            {
              order: "05",
              name: "Triceps Rope Pushdown",
              target: "3 sets × 12–15 reps",
              load: "25 kg pin",
              rest: "60s rest",
            },
          ].map((ex) => (
            <div
              key={ex.order}
              className="flex items-center justify-between px-4 py-3 hover:bg-surface-2/70 transition-colors text-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-xs text-muted-foreground font-semibold">
                  {ex.order}
                </span>
                <span className="font-medium text-foreground truncate">
                  {ex.name}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                <span className="hidden sm:inline">{ex.load}</span>
                <span className="font-mono bg-card px-2 py-1 rounded border border-border text-foreground">
                  {ex.target}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Dominant Amber CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <p className="text-xs text-muted-foreground">
            Equipment ready: Barbell, adjustable bench, dumbbells, cable station.
          </p>

          <Link
            href="/session/demo"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold px-8 py-3 rounded-md hover:bg-primary/90 transition-colors shadow-xs text-sm"
          >
            Start session
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>

      {/* 3. Quick Stats & Recent Activity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Streak card */}
        <div className="rounded-md border border-border bg-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Weekly Streak</span>
            <Flame className="size-4 text-primary" />
          </div>
          <div className="font-display font-extrabold text-3xl text-foreground">
            4 SESSIONS
          </div>
          <p className="text-xs text-muted-foreground">
            On track with your 4-day push/pull/legs routine.
          </p>
        </div>

        {/* Volume card */}
        <div className="rounded-md border border-border bg-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Total Volume</span>
            <Dumbbell className="size-4 text-muted-foreground" />
          </div>
          <div className="font-display font-extrabold text-3xl text-foreground">
            18,420 <span className="text-base font-sans font-normal text-muted-foreground">kg</span>
          </div>
          <p className="text-xs text-muted-foreground">
            +6.4% load progression from previous week.
          </p>
        </div>

        {/* Next up preview */}
        <div className="rounded-md border border-border bg-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Tomorrow</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </div>
          <div className="font-display font-extrabold text-2xl text-foreground truncate">
            Pull & Posterior Chain
          </div>
          <p className="text-xs text-muted-foreground">
            Deadlifts, chest-supported rows, and curls scheduled.
          </p>
        </div>
      </div>
    </div>
  );
}
