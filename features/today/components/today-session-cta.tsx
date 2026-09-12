"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { startSessionAction } from "@/features/sessions/actions";
import type { TodayPageData } from "@/features/sessions/schemas";

type TodaySessionCtaProps = {
  hasActivePlan: boolean;
  isRestDay: boolean;
  planDayId: string | null;
  session: TodayPageData["session"];
};

function getCtaConfig(props: TodaySessionCtaProps): {
  label: string;
  href: string | null;
  disabled: boolean;
  variant: "primary" | "completed";
  helperText: string | null;
} {
  if (!props.hasActivePlan) {
    return {
      label: "Create a plan",
      href: "/planner",
      disabled: false,
      variant: "primary",
      helperText: "Activate a routine to start logging workouts.",
    };
  }

  if (props.session.kind === "completed_today") {
    return {
      label: "View session",
      href: `/session/${props.session.sessionId}`,
      disabled: false,
      variant: "completed",
      helperText: "Today's workout is complete.",
    };
  }

  if (props.session.kind === "active" || props.session.kind === "paused") {
    const label =
      props.session.kind === "paused" ? "Resume session" : "Continue session";

    return {
      label: props.session.matchesTodayPlanDay ? label : "Continue current session",
      href: `/session/${props.session.sessionId}`,
      disabled: false,
      variant: "primary",
      helperText: props.session.matchesTodayPlanDay
        ? null
        : "You have an in-progress session for a different workout day.",
    };
  }

  if (props.isRestDay || !props.planDayId) {
    return {
      label: "Rest day",
      href: null,
      disabled: true,
      variant: "primary",
      helperText: "No workout scheduled for today.",
    };
  }

  return {
    label: "Start session",
    href: null,
    disabled: false,
    variant: "primary",
    helperText: null,
  };
}

export function TodaySessionCta(props: TodaySessionCtaProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const config = getCtaConfig(props);

  function handleStartSession() {
    if (!props.planDayId) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await startSessionAction(props.planDayId!);
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  const buttonClassName =
    "w-full sm:w-auto inline-flex items-center justify-center gap-2 font-bold px-8 py-3 rounded-md transition-colors shadow-xs text-sm disabled:opacity-60 disabled:pointer-events-none";

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 w-full">
      <p className="text-xs text-muted-foreground">
        {config.helperText ??
          (props.hasActivePlan && !props.isRestDay ? "Ready when you are." : null)}
      </p>

      <div className="w-full sm:w-auto space-y-2">
        {error && (
          <p className="text-xs text-destructive text-center sm:text-right">
            {error}
          </p>
        )}

        {config.href ? (
          <Link
            href={config.href}
            className={`${buttonClassName} ${
              config.variant === "completed"
                ? "border border-border bg-surface-2 text-foreground hover:bg-border"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {config.variant === "completed" ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <ArrowUpRight className="size-4" />
            )}
            {config.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleStartSession}
            disabled={config.disabled || isPending}
            className={`${buttonClassName} bg-primary text-primary-foreground hover:bg-primary/90`}
          >
            <ArrowUpRight className="size-4" />
            {isPending ? "Starting..." : config.label}
          </button>
        )}
      </div>
    </div>
  );
}
