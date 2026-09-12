import "server-only";

import {
  endOfDay,
  endOfWeek,
  startOfDay,
  startOfWeek,
  subWeeks,
} from "date-fns";
import type { User } from "@/db";
import {
  getActivePlanForUser,
  inferSchedulingMode,
  resolvePlanDayForDate,
  resolveTomorrowPlanDay,
} from "@/features/plans";
import {
  getActiveSessionForUser,
  getCompletedSessionForPlanDayToday,
  getCompletedSessionsForWeek,
  getLastCompletedSessionForPlanInRange,
  getWeeklyVolume,
} from "@/features/sessions/repository";
import type { TodayPageData, TodaySessionState } from "@/features/sessions/schemas";
import {
  formatEquipmentLabel,
  formatGoalLabel,
  formatVolume,
  mapExercisesToPreviews,
} from "./formatters";

function buildSessionState(params: {
  activeSession: Awaited<ReturnType<typeof getActiveSessionForUser>>;
  completedToday: Awaited<ReturnType<typeof getCompletedSessionForPlanDayToday>>;
  todayPlanDayId: string | null;
}): TodaySessionState {
  if (params.activeSession) {
    return {
      kind: params.activeSession.status === "paused" ? "paused" : "active",
      sessionId: params.activeSession.id,
      matchesTodayPlanDay:
        params.todayPlanDayId != null &&
        params.activeSession.sourcePlanDayId === params.todayPlanDayId,
    };
  }

  if (params.completedToday) {
    return {
      kind: "completed_today",
      sessionId: params.completedToday.id,
    };
  }

  return { kind: "none" };
}

function buildStreakDescription(
  completedCount: number,
  plannedCount: number,
  planTitle: string
): string {
  if (completedCount >= plannedCount) {
    return `On track with your ${plannedCount}-day ${planTitle} routine.`;
  }

  if (completedCount === 0) {
    return `Start your first session this week for ${planTitle}.`;
  }

  return `${completedCount} of ${plannedCount} planned sessions done this week.`;
}

function buildTomorrowSubtitle(day: {
  focus: string | null;
  exercises: Array<{ name: string }>;
}): string {
  if (day.focus) {
    return day.focus;
  }

  const preview = day.exercises
    .slice(0, 3)
    .map((exercise) => exercise.name)
    .join(", ");

  if (!preview) {
    return "Workout scheduled for tomorrow.";
  }

  return `${preview}${day.exercises.length > 3 ? ", and more" : ""} scheduled.`;
}

export async function getTodayPageData(user: User): Promise<TodayPageData> {
  const referenceDate = new Date();
  const dateLabel = referenceDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 });
  const dayStart = startOfDay(referenceDate);
  const dayEnd = endOfDay(referenceDate);
  const previousWeekStart = startOfWeek(subWeeks(referenceDate, 1), {
    weekStartsOn: 1,
  });
  const previousWeekEnd = endOfWeek(subWeeks(referenceDate, 1), {
    weekStartsOn: 1,
  });

  const activePlan = await getActivePlanForUser(user.id);

  if (!activePlan) {
    const [weeklySessionCount, weeklyVolume, previousVolume] = await Promise.all([
      getCompletedSessionsForWeek({
        userId: user.id,
        weekStart,
        weekEnd,
      }).then((sessions) => sessions.length),
      getWeeklyVolume({ userId: user.id, weekStart, weekEnd }),
      getWeeklyVolume({
        userId: user.id,
        weekStart: previousWeekStart,
        weekEnd: previousWeekEnd,
      }),
    ]);

    const volumeChangePercent =
      previousVolume > 0
        ? ((weeklyVolume - previousVolume) / previousVolume) * 100
        : null;

    return {
      dateLabel,
      hasActivePlan: false,
      adherence: null,
      workout: null,
      isRestDay: false,
      session: { kind: "none" },
      stats: {
        weeklySessionCount,
        weeklyVolume,
        volumeUnit: user.weightUnit,
        volumeChangePercent,
        streakDescription: "Activate a plan to track your weekly training.",
      },
      tomorrow: null,
    };
  }

  const { plan, days } = activePlan;
  const schedulingMode = inferSchedulingMode(days, plan.daysPerWeek);

  const [
    activeSession,
    lastCompletedThisWeek,
    completedThisWeek,
    weeklyVolume,
    previousVolume,
  ] = await Promise.all([
    getActiveSessionForUser(user.id),
    getLastCompletedSessionForPlanInRange({
      userId: user.id,
      planId: plan.id,
      rangeStart: weekStart,
      rangeEnd: weekEnd,
    }),
    getCompletedSessionsForWeek({
      userId: user.id,
      planId: plan.id,
      weekStart,
      weekEnd,
    }),
    getWeeklyVolume({ userId: user.id, weekStart, weekEnd }),
    getWeeklyVolume({
      userId: user.id,
      weekStart: previousWeekStart,
      weekEnd: previousWeekEnd,
    }),
  ]);

  const lastCompletedDayNumber = lastCompletedThisWeek?.sourcePlanDayId
    ? days.find((day) => day.id === lastCompletedThisWeek.sourcePlanDayId)
        ?.dayNumber ?? null
    : null;

  const resolvedTodayPlanDay = resolvePlanDayForDate({
    days,
    schedulingMode,
    referenceDate,
    lastCompletedDayNumber,
  });

  const todayPlanDay = resolvedTodayPlanDay
    ? (days.find((day) => day.id === resolvedTodayPlanDay.id) ?? null)
    : null;

  const resolvedTomorrowPlanDay = resolveTomorrowPlanDay({
    days,
    schedulingMode,
    referenceDate,
    todayPlanDay: resolvedTodayPlanDay,
    lastCompletedDayNumber,
  });

  const tomorrowPlanDay = resolvedTomorrowPlanDay
    ? (days.find((day) => day.id === resolvedTomorrowPlanDay.id) ?? null)
    : null;

  const completedToday =
    todayPlanDay != null
      ? await getCompletedSessionForPlanDayToday({
          userId: user.id,
          planDayId: todayPlanDay.id,
          dayStart,
          dayEnd,
        })
      : null;

  const session = buildSessionState({
    activeSession,
    completedToday,
    todayPlanDayId: todayPlanDay?.id ?? null,
  });

  const isRestDay = schedulingMode === "fixed_weekdays" && todayPlanDay == null;
  const volumeChangePercent =
    previousVolume > 0
      ? ((weeklyVolume - previousVolume) / previousVolume) * 100
      : null;

  const workout =
    todayPlanDay != null
      ? {
          planId: plan.id,
          planDayId: todayPlanDay.id,
          planTitle: plan.title,
          planGoalLabel: formatGoalLabel(plan.goal),
          dayTitle: todayPlanDay.title,
          focus: todayPlanDay.focus,
          estimatedMinutes: todayPlanDay.estimatedMinutes,
          exerciseCount: todayPlanDay.exercises.length,
          totalSets: todayPlanDay.exercises.reduce(
            (total, exercise) => total + exercise.targetSets,
            0
          ),
          exercises: mapExercisesToPreviews(
            todayPlanDay.exercises,
            user.weightUnit
          ),
          equipmentLabel: formatEquipmentLabel(
            todayPlanDay.exercises.map((exercise) => exercise.equipmentSlug)
          ),
        }
      : null;

  return {
    dateLabel,
    hasActivePlan: true,
    adherence: todayPlanDay
      ? {
          dayLabel: `Day ${todayPlanDay.dayNumber}`,
          completedThisWeek: completedThisWeek.length,
          plannedThisWeek: plan.daysPerWeek,
        }
      : {
          dayLabel: "Rest day",
          completedThisWeek: completedThisWeek.length,
          plannedThisWeek: plan.daysPerWeek,
        },
    workout,
    isRestDay,
    session,
    stats: {
      weeklySessionCount: completedThisWeek.length,
      weeklyVolume,
      volumeUnit: user.weightUnit,
      volumeChangePercent,
      streakDescription: buildStreakDescription(
        completedThisWeek.length,
        plan.daysPerWeek,
        plan.title
      ),
    },
    tomorrow: tomorrowPlanDay
      ? {
          title: tomorrowPlanDay.title,
          subtitle: buildTomorrowSubtitle(tomorrowPlanDay),
        }
      : schedulingMode === "fixed_weekdays"
        ? {
            title: "Rest day",
            subtitle: "Recovery scheduled for tomorrow.",
          }
        : null,
  };
}

export { formatVolume };
